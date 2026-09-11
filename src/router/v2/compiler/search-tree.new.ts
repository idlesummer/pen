import type { RouteNode } from './route-tree'
import { dict } from '@/lib/dict'
import { traverse } from '@/lib/traverse'
import { createRouteTree, forEach } from './route-tree'
import { DEFAULT_FALLBACK_PATH } from '@/router/compiling/route-module'
import { isDynamicOrCatchall, isUrlConsuming } from './segment'

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
  // Tree children
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

function createSearchNode(routeNode: RouteNode, parent: SearchNode, ctx: BuildContext): SearchNode {
  const segment = routeNode.segment
  const node: SearchNode = {
    urlDepth: parent.urlDepth + +isUrlConsuming(segment.type),
    staticness: parent.staticness - +isDynamicOrCatchall(segment.type),
    depth: parent.depth + 1,
    fallback: undefined as never, // filled by resolveEndpoints, once every position exists
  }
  if (isDynamicOrCatchall(segment.type))
    node.param = segment.value
  if (segment.type === 'catchall')
    node.isCatchall = true

  ctx.anchorOf.set(node, routeNode)
  ctx.nodes.push(node)
  return node
}

/** Where routing stops inheriting: the app root, and each slot. Both must
 *  always be able to render "nothing claimed this", so both always carry a
 *  default - a real one if declared, the built-in otherwise. */
function isBoundary(routeNode: RouteNode): boolean {
  return !routeNode.parent || routeNode.segment.type === 'slot'
}

/** A folder's own Frame, or undefined if it wraps nothing at all - a plain
 *  folder with no layout/loading/error/default contributes nothing to the
 *  chain, so there's no point giving it one. */
function createFrame(routeNode: RouteNode): Frame | undefined {
  const { layout, loading, error } = routeNode.modulePaths
  const def = routeNode.modulePaths.default ?? (isBoundary(routeNode) ? DEFAULT_FALLBACK_PATH : undefined)
  if (!layout && !loading && !error && !def)
    return
  return { layout, loading, error, default: def }
}

/** True if a frame still renders something once assembled. */
function wraps(frame: Frame): boolean {
  return !!(frame.layout || frame.loading || frame.error || frame.default)
}

/** The next ancestor routing inherits from, or nothing at a slot boundary -
 *  a slot's own subtree renders through its own chain, never through
 *  whatever folder happens to surround the slot. */
function inheritedParent(routeNode: RouteNode): RouteNode | undefined {
  if (routeNode.segment.type !== 'slot')
    return routeNode.parent
}

function compactMapAncestors<T>(routeNode: RouteNode, fn: (node: RouteNode) => T | undefined) {
  const result: T[] = []
  for (let node: RouteNode | undefined = routeNode; node; node = inheritedParent(node)) {
    const value = fn(node)
    if (value !== undefined)
      result.push(value)
  }
  return result
}

/** The same frame without its own `default` - for an endpoint whose content
 *  IS that default, so it isn't also a boundary around itself. */
function stripOwnDefault(frame: Frame): Frame {
  const { layout, loading, error } = frame
  return { layout, loading, error }
}

/** Flattens a folder's ancestry into the chain that wraps it - the walk the
 *  render stage would otherwise repeat on every navigation. */
function createEndpoint(owner: RouteNode, content: string, isFallback: boolean, ctx: BuildContext): Endpoint {
  const frames = compactMapAncestors(owner, createFrame).reverse()

  // A fallback's innermost frame always carries the very module the endpoint
  // renders, so it would otherwise be a boundary around itself.
  if (isFallback && frames.length)
    frames[frames.length-1] = stripOwnDefault(frames[frames.length-1]!)

  const contentDepth = ctx.positionOf.get(owner)!.depth
  return { frames: frames.filter(wraps), content, contentDepth }
}

/** The folder whose `default` covers this position - or, if nothing up the
 *  chain declares one, the boundary itself (the root, or the enclosing slot).
 *  That boundary is where the built-in fallback is used, which is how "every
 *  position renders something" holds without injecting anything into the
 *  route tree. */
function findDefaultOwner(routeNode: RouteNode): RouteNode {
  for (let node = routeNode; ; ) {
    if (node.modulePaths.default) return node
    const parent = inheritedParent(node)
    if (!parent) return node
    node = parent
  }
}

/** Resolves every position's page (if it has one) and fallback (always) -
 *  runs once every folder's frame and page ownership is known. */
function resolveEndpoints(ctx: BuildContext) {
  for (const searchNode of ctx.nodes) {
    const pageOwner = ctx.pageOwnerOf.get(searchNode)
    if (pageOwner)
      searchNode.endpoint = createEndpoint(pageOwner, pageOwner.modulePaths.page!, false, ctx)

    const defaultOwner = findDefaultOwner(ctx.anchorOf.get(searchNode)!)
    const content = defaultOwner.modulePaths.default ?? DEFAULT_FALLBACK_PATH
    searchNode.fallback = createEndpoint(defaultOwner, content, true, ctx)
  }
}

/** Gets the position a folder belongs to, creating it if it doesn't exist
 *  yet - a group just returns the one already there (its parent's), while
 *  everything else looks up or opens its own. Slots aren't handled yet -
 *  their folders are excluded from the walk entirely, see expandChildren. */
function getOrCreatePosition(routeNode: RouteNode, parent: SearchNode, ctx: BuildContext): SearchNode {
  const segment = routeNode.segment
  switch (segment.type) {
    default: // group
      return parent
    case 'static':
      parent.statics ??= dict<SearchNode>()
      return parent.statics[segment.value] ??= createSearchNode(routeNode, parent, ctx)
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
  if (routeNode.segment.type === 'catchall')
    return []
  return routeNode.children.filter(child =>
    child.segment.type !== 'malformed' && child.segment.type !== 'slot')
}

export function createSearchTree(routeTree: RouteNode): SearchNode {
  const searchTree: SearchNode = {
    urlDepth: 0,
    staticness: 0,
    depth: 0,
    fallback: undefined as never,
  }
  const ctx: BuildContext = {
    anchorOf: new Map([[searchTree, routeTree]]),
    positionOf: new Map([[routeTree, searchTree]]), // seeded, so every child can read its parent's
    pageOwnerOf: new Map<SearchNode, RouteNode>(),
    nodes: [searchTree],
  }

  traverse(routeTree, {
    visit: (routeNode) => { // the folder's own contribution: does it own this position's page?
      if (!routeNode.modulePaths.page) return
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

  resolveEndpoints(ctx)
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
  │   │   └── page.tsx
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
  'blog/[slug]/page.tsx',
  'blog/[...rest]/page.tsx',
  'blog/[...rest]/dead/page.tsx',
  '[bad/page.tsx',
  '@modal/page.tsx',
])
console.log(JSON.stringify(createSearchTree(routeTree), null, 2))

console.log('\n--- frames (standalone, no positions involved) ---')
forEach(routeTree, (routeNode) => {
  const frame = createFrame(routeNode)
  if (frame) console.log(routeNode.path || '(root)', '->', JSON.stringify(frame), 'wraps:', wraps(frame))
})

console.log('\n--- step 4: page/fallback wired onto real positions ---')
const wiredFixture = createRouteTree([
  'layout.tsx',
  'blog/layout.tsx',
  'blog/page.tsx',
  'blog/[id]/layout.tsx',
  'blog/[id]/page.tsx',
  'blog/[id]/default.tsx',
])
const wiredTree = createSearchTree(wiredFixture)
console.log('root.fallback (built-in, wrapped by root layout):', JSON.stringify(wiredTree.fallback))
console.log('blog.endpoint (frames: root, blog):', JSON.stringify(wiredTree.statics!.blog!.endpoint))
console.log('blog.fallback (no own default - walks up to the root boundary):',
  JSON.stringify(wiredTree.statics!.blog!.fallback))
console.log('blog.[id].endpoint (frames: root, blog, [id]):', JSON.stringify(wiredTree.statics!.blog!.dynamic!.endpoint))
console.log('blog.[id].fallback ([id]\'s own default, its frame stripped):',
  JSON.stringify(wiredTree.statics!.blog!.dynamic!.fallback))

// if they have lots of hearts you exhaust your own hearts
// play high early game but not too high
// dont play trump card early game
// when they put down high cards, put down high cards next game
//
