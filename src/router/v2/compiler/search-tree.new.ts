import type { RouteNode } from './route-tree'
import { dict } from '@/lib/dict'
import { traverse } from '@/lib/traverse'
import { createRouteTree } from './route-tree'
import { DEFAULT_FALLBACK_PATH } from '@/router/compiling/route-module'
import { isBoundary, isDynamicOrCatchall, isUrlConsuming } from './segment'

/** One folder's wrapping modules - everything it contributes AROUND a page,
 *  never the page itself. A folder earns a Frame only if it wraps something. */
export type Frame = {
  layout?: string
  loading?: string
  error?: string
  default?: string
}

/** Everything needed to render one accepted position: the complete wrapper
 *  chain, outermost first, and the module at the bottom of it. */
export type Endpoint = {
  frames: Frame[]
  content: string
  contentDepth: number // which position's params `content` receives
}

/** One URL position: somewhere a URL segment can land. Groups fold
 *  transparently into the position around them, so this is never "a folder" -
 *  several RouteNodes can share one SearchNode. */
export type SearchNode = {
  urlDepth: number    // url segments consumed to reach this position
  staticness: number  // how static-preferring the path here is; higher wins
  depth: number        // this position's index in its own match path
  param?: string       // the name this position binds, for dynamic/catch-all
  // Flags
  isCatchall?: true    // accepts even with url segments left over
  // Children
  statics?: Record<string, SearchNode>
  dynamic?: SearchNode
  catchall?: SearchNode
  // Rendering
  endpoint?: Endpoint // set when a folder in this position's territory owns a page
  fallback: Endpoint  // always present - the default guarantee, resolved here
}

/** Build-time bookkeeping, dropped once createSearchTree returns. */
type BuildContext = {
  anchorOf: Map<SearchNode, RouteNode>   // position -> the folder that opened it
  positionOf: Map<RouteNode, SearchNode> // folder -> the position it belongs to
  pageOwnerOf: Map<SearchNode, RouteNode>
  nodes: SearchNode[]                    // every position, for the final resolve pass
}

// ── routing rules over the route tree ──────────────────────────────────────
// These stop at slot boundaries, which is a statement about how routing
// inherits rather than about folders - so they live here, not in route-tree.

function compactMapAncestors<T>(routeNode: RouteNode, fn: (node: RouteNode) => T | undefined): T[] {
  const values: T[] = []
  // No condition needed since we always stop at a default or boundary
  for (let node = routeNode; ; node = node.parent!) {
    const value = fn(node)
    if (value !== undefined)   values.push(value)
    if (isBoundary(node.type)) break
  }
  return values
}

/** The folder whose `default` covers this position - or, if nothing up the
 *  chain declares one, the boundary itself (the root, or the enclosing slot).
 *  That boundary is where the built-in fallback is used, which is how "every
 *  position renders something" holds without injecting anything into the
 *  route tree. */
function findDefaultOwner(routeNode: RouteNode): RouteNode {
  for (let node = routeNode; ; node = node.parent!) {
    if (node.modules.default || isBoundary(node.type))
      return node
  }
}

// ── frames ───────────────────────────────────────────────────────────────

/** A folder's own Frame, or undefined if it wraps nothing at all - a plain
 *  folder with no layout/loading/error/default contributes nothing to the
 *  chain, so there's no point giving it one. */
function createFrame(routeNode: RouteNode): Frame | undefined {
  const { layout, loading, error, default: def } = routeNode.modules
  const defaultPath = def ?? (isBoundary(routeNode.type) ? DEFAULT_FALLBACK_PATH : undefined)
  if (layout || loading || error || defaultPath)
    return { layout, loading, error, default: defaultPath }
}

/** The same frame without its own `default` - for an endpoint whose content
 *  IS that default, so it isn't also a boundary around itself. */
function removeDefault(frame: Frame): Frame {
  const { layout, loading, error } = frame
  return { layout, loading, error }
}

// ── endpoints ───────────────────────────────────────────────────────────

/** Flattens a folder's ancestry into the chain that wraps it - the walk the
 *  render stage would otherwise repeat on every navigation. */
function createEndpoint(pageOwner: RouteNode, content: string, ctx: BuildContext): Endpoint {
  const frames = compactMapAncestors(pageOwner, createFrame).reverse()
  const contentDepth = ctx.positionOf.get(pageOwner)!.depth
  return { frames, content, contentDepth }
}

function createFallback(defaultOwner: RouteNode, content: string, ctx: BuildContext): Endpoint {
  const endpoint = createEndpoint(defaultOwner, content, ctx)
  const frames = endpoint.frames
  const lastFrame = frames[frames.length-1]
  if (!lastFrame)
    return endpoint

  // The innermost frame renders the fallback itself, so remove its default.
  if (lastFrame.layout || lastFrame.loading || lastFrame.error)
    frames[frames.length-1] = removeDefault(lastFrame)
  else
    frames.pop()
  return endpoint
}

/** Resolves every position's page (if it has one) and fallback (always) -
 *  runs once every folder's frame and page ownership is known. */
function populateEndpoints(ctx: BuildContext) {
  for (const searchNode of ctx.nodes) {
    const pageOwner = ctx.pageOwnerOf.get(searchNode)
    if (pageOwner)
      searchNode.endpoint = createEndpoint(pageOwner, pageOwner.modules.page!, ctx)

    const defaultOwner = findDefaultOwner(ctx.anchorOf.get(searchNode)!)
    const content = defaultOwner.modules.default ?? DEFAULT_FALLBACK_PATH
    searchNode.fallback = createFallback(defaultOwner, content, ctx)
  }
}

// ── positions ───────────────────────────────────────────────────────────

function createSearchNode(routeNode: RouteNode, parent: SearchNode, ctx: BuildContext): SearchNode {
  const type = routeNode.type
  const node: SearchNode = {
    urlDepth: parent.urlDepth + +isUrlConsuming(type),
    staticness: parent.staticness - +isDynamicOrCatchall(type),
    depth: parent.depth + 1,
    fallback: undefined as never, // filled by populateEndpoints, once every position exists
  }
  if (isDynamicOrCatchall(type))
    node.param = routeNode.segment
  if (type === 'catchall')
    node.isCatchall = true

  ctx.anchorOf.set(node, routeNode)
  ctx.nodes.push(node)
  return node
}

/** Gets the position a folder belongs to, creating it if it doesn't exist
 *  yet - a group just returns the one already there (its parent's), while
 *  everything else looks up or opens its own. Slots aren't handled yet -
 *  their folders are excluded from the walk entirely, see expandChildren. */
function getOrCreatePosition(routeNode: RouteNode, parent: SearchNode, ctx: BuildContext): SearchNode {
  switch (routeNode.type) {
    default: // group
      return parent
    case 'static':
      parent.statics ??= dict<SearchNode>()
      return parent.statics[routeNode.segment] ??= createSearchNode(routeNode, parent, ctx)
    case 'dynamic':
      return parent.dynamic ??= createSearchNode(routeNode, parent, ctx)
    case 'catchall':
      return parent.catchall ??= createSearchNode(routeNode, parent, ctx)
  }
}

/** The children worth walking, for now: a catch-all is terminal, and slots
 *  are out of scope until they get their own step. Malformed folders are
 *  skipped too - they carry no route to open a position with. */
function expandChildren(routeNode: RouteNode): RouteNode[] {
  if (routeNode.type === 'catchall')
    return []
  return routeNode.children.filter(child => child.type !== 'malformed' && child.type !== 'slot')
}

// ── build ───────────────────────────────────────────────────────────────

export function createSearchTree(routeTree: RouteNode): SearchNode {
  const searchTree: SearchNode = {
    urlDepth: 0,
    staticness: 0,
    depth: 0,
    fallback: undefined as never, //* Must be populated later
  }
  const ctx: BuildContext = {
    anchorOf: new Map([[searchTree, routeTree]]),
    positionOf: new Map([[routeTree, searchTree]]), // seeded, so every child can read its parent's
    pageOwnerOf: new Map<SearchNode, RouteNode>(),
    nodes: [searchTree],
  }

  traverse(routeTree, {
    visit: (routeNode) => { // the folder's own contribution: does it own this position's page?
      if (!routeNode.modules.page) return // after this, routeNode is a page owner
      const searchNode = ctx.positionOf.get(routeNode)!
      ctx.pageOwnerOf.getOrInsert(searchNode, routeNode)
    },
    expand: expandChildren,
    attach: (childRouteNode, parentRouteNode) => {
      const parentSearchNode = ctx.positionOf.get(parentRouteNode)!
      const childSearchNode = getOrCreatePosition(childRouteNode, parentSearchNode, ctx)
      ctx.positionOf.set(childRouteNode, childSearchNode)
    },
  })

  populateEndpoints(ctx)
  return searchTree
}

console.log(`
  app/
  ├── page.tsx
  ├── (marketing)/
  │   └── blog/
  │       └── page.tsx
  ├── blog/
  │   ├── page.tsx
  │   ├── [id]/
  │   │   ├── page.tsx
  │   │   └── default.tsx
  │   ├── [slug]/
  │   │   └── page.tsx
  │   └── [...rest]/
  │       ├── page.tsx
  │       └── dead/
  │           └── page.tsx
  ├── [bad/
  │   └── page.tsx
  └── @modal/
      └── page.tsx
`)

const routeTree = createRouteTree([
  'page.tsx',
  '(marketing)/blog/page.tsx',
  'blog/page.tsx',
  'blog/[id]/page.tsx',
  'blog/[id]/default.tsx',
  'blog/[slug]/page.tsx',
  'blog/[...rest]/page.tsx',
  'blog/[...rest]/dead/page.tsx',
  '[bad/page.tsx',
  '@modal/page.tsx',
])
console.log(JSON.stringify(createSearchTree(routeTree), null, 2))
