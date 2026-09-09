import type { RouteNode } from './route-tree'
import { dict } from '@/lib/dict'
import { traverse } from '@/lib/traverse'
import { createRouteTree } from './route-tree'
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


// if they have lots of hearts you exhaust your own hearts
// play high early game but not too high
// dont play trump card early game
// when they put down high cards, put down high cards next game
//
