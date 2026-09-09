import type { RouteNode } from './route-tree'
import { dict } from '@/lib/dict'
import { traverse } from '@/lib/traverse'
import { createRouteTree, forEach } from './route-tree'
import { DEFAULT_FALLBACK_PATH } from '@/router/compiling/route-module'
import { isDynamicOrCatchall, isUrlConsuming } from '@/router/compiling/segment'

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
}

function createSearchNode(routeNode: RouteNode, parent: SearchNode): SearchNode {
  const segment = routeNode.segment
  const node: SearchNode = {
    urlDepth: parent.urlDepth + +isUrlConsuming(segment),
    staticness: parent.staticness - +isDynamicOrCatchall(segment),
    depth: parent.depth + 1,
  }
  if (isDynamicOrCatchall(segment))
    node.param = segment.value
  if (segment.type === 'catchall')
    node.isCatchall = true
  return node
}

/** One folder's wrapping modules - everything it contributes AROUND a page,
 *  never the page itself. A folder earns a Frame only if it wraps something. */
export type Frame = {
  layout?: string
  loading?: string
  error?: string
  default?: string
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

/** Gets the position a folder belongs to, creating it if it doesn't exist
 *  yet - a group just returns the one already there (its parent's), while
 *  everything else looks up or opens its own. Slots aren't handled yet -
 *  their folders are excluded from the walk entirely, see expandChildren. */
function getOrCreatePosition(routeNode: RouteNode, parent: SearchNode): SearchNode {
  const segment = routeNode.segment

  switch (segment.type) {
    case 'group':
      return parent

    case 'static':
      parent.statics ??= dict<SearchNode>()
      return parent.statics[segment.value] ??= createSearchNode(routeNode, parent)

    case 'dynamic':
      return parent.dynamic ??= createSearchNode(routeNode, parent)

    default: // catchall
      return parent.catchall ??= createSearchNode(routeNode, parent)
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
  const searchTree: SearchNode = { urlDepth: 0, staticness: 0, depth: 0 }
  const positionOf = new Map([[routeTree, searchTree]])

  traverse(routeTree, {
    expand: expandChildren,
    attach: (childRouteNode, parentRouteNode) => {
      const parentPosition = positionOf.get(parentRouteNode)!
      positionOf.set(childRouteNode, getOrCreatePosition(childRouteNode, parentPosition))
    },
  })
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

// if they have lots of hearts you exhaust your own hearts
// play high early game but not too high
// dont play trump card early game
// when they put down high cards, put down high cards next game
//
