import type { RouteNode } from './route-tree'
import type { CompiledSearchTree, PositionConflicts, SearchNode } from './search-node'
import { dict } from '@/lib/dict'
import { traverse } from '@/lib/traverse'
import { createRouteTree } from './route-tree'
import { populateEndpoints } from './search-tree-endpoints'
import { isBoundary, isDynamicOrCatchall, isUrlConsuming } from './route-segment'

// ── routing rules over the route tree ──────────────────────────────────────
// This stops at slot boundaries, which is a statement about how routing
// inherits rather than about folders - so it lives here, not in route-tree.

/** This folder's own nearest real default - itself, if it declares one or is
 *  a boundary, otherwise the nearest ancestor that does. */
function findDefaultOwner(routeNode: RouteNode): RouteNode {
  for (let node = routeNode; ; node = node.parent!) {
    if (node.modules.default || isBoundary(node.type))
      return node
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

export function createSearchTree(routeTree: RouteNode): CompiledSearchTree {
  const searchTree: SearchNode = {
    urlDepth: 0,
    staticness: 0,
    depth: 0,
    fallback: undefined as never, //* Must be populated later
  }
  const positionOf = new Map([[routeTree, searchTree]]) // folder -> the position it belongs to, seeded so every child can read its parent's
  const pageOwnerOf = new Map<SearchNode, RouteNode>()
  const defaultOwnerOf = new Map<SearchNode, RouteNode>()
  const conflictsOf = new Map<SearchNode, PositionConflicts>()
  const searchNodes = [searchTree] // every position, for the final resolve pass

  function createSearchNode(routeNode: RouteNode, parent: SearchNode): SearchNode {
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
    searchNodes.push(node)
    return node
  }

  /** This position's conflict-tracking record, creating it on first touch. */
  function conflictsFor(position: SearchNode): PositionConflicts {
    return conflictsOf.getOrInsertComputed(position, () => ({
      pages: [],
      catchalls: [],
      dynamics: dict(),
      defaults: new Set(),
    }))
  }

  /** Gets the position a folder belongs to, creating it if it doesn't exist
   *  yet - a group just returns the one already there (its parent's), while
   *  everything else looks up or opens its own. Slots aren't handled yet -
   *  their folders are excluded from the walk entirely, see expandChildren. */
  function getOrCreatePosition(routeNode: RouteNode, parent: SearchNode): SearchNode {
    switch (routeNode.type) {
      default: // group
        return parent
      case 'static':
        parent.statics ??= dict<SearchNode>()
        return parent.statics[routeNode.segment] ??= createSearchNode(routeNode, parent)
      case 'dynamic':
        conflictsFor(parent).dynamics[routeNode.segment] ??= routeNode
        return parent.dynamic ??= createSearchNode(routeNode, parent)
      case 'catchall':
        conflictsFor(parent).catchalls.push(routeNode)
        return parent.catchall ??= createSearchNode(routeNode, parent)
    }
  }

  traverse(routeTree, {
    visit: (routeNode) => { // the folder's own contribution: does it own this position's page, and/or its default?
      const searchNode = positionOf.get(routeNode)!

      // A real default always beats an implicit one at the boundary
      // There also can't be multiple defaults in the same position
      const defaultOwner = findDefaultOwner(routeNode)
      if (!defaultOwnerOf.has(searchNode) || defaultOwner.modules.default)
        defaultOwnerOf.set(searchNode, defaultOwner)

      // Several folders can climb to the same real default without
      // conflicting - only distinct owners count as competing claims.
      if (defaultOwner.modules.default)
        conflictsFor(searchNode).defaults.add(defaultOwner)

      if (!routeNode.modules.page) return // after this, routeNode is a page owner
      pageOwnerOf.getOrInsert(searchNode, routeNode)
      conflictsFor(searchNode).pages.push(routeNode)
    },
    expand: expandChildren,
    attach: (childRouteNode, parentRouteNode) => {
      const parentSearchNode = positionOf.get(parentRouteNode)!
      const childSearchNode = getOrCreatePosition(childRouteNode, parentSearchNode)
      positionOf.set(childRouteNode, childSearchNode)
    },
  })

  populateEndpoints({ searchNodes, positionOf, pageOwnerOf, defaultOwnerOf })
  return { root: searchTree, conflicts: [...conflictsOf.values()] }
}

console.log(`
  app/
  ├── layout.tsx
  ├── page.tsx
  ├── (marketing)/
  │   └── blog/
  │       ├── page.tsx
  │       └── default.tsx
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
  'layout.tsx',
  'page.tsx',
  '(marketing)/blog/page.tsx',
  '(marketing)/blog/default.tsx',
  'blog/page.tsx',
  'blog/[id]/page.tsx',
  'blog/[id]/default.tsx',
  'blog/[slug]/page.tsx',
  'blog/[...rest]/page.tsx',
  'blog/[...rest]/dead/page.tsx',
  '[bad/page.tsx',
  '@modal/page.tsx',
])
const { root, conflicts } = createSearchTree(routeTree)
console.log(JSON.stringify(root, null, 2))

const realConflicts = conflicts
  .filter(c => c.pages.length > 1 || c.catchalls.length > 1 || c.defaults.size > 1 || Object.keys(c.dynamics).length > 1)
  .map(c => ({
    pages: c.pages.map(n => n.path),
    catchalls: c.catchalls.map(n => n.path),
    defaults: [...c.defaults].map(n => n.path),
    dynamics: Object.fromEntries(Object.entries(c.dynamics).map(([param, n]) => [param, n.path])),
  }))
console.log('conflicts:', JSON.stringify(realConflicts, null, 2))
