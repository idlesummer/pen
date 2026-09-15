import type { RouteNode } from './route-tree'
import type { PositionConflicts, SearchContext, SearchNode } from './search-node'
import { dict } from '@/lib/dict'
import { traverse } from '@/lib/traverse'
import { createRouteTree } from './route-tree'
import { setEndpoints } from './search-tree-endpoints'
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

/** The children worth walking: a catch-all is terminal, and once inside a
 *  slot, a further nested slot is excluded - slot subtrees are terminal for
 *  further slot-nesting, which is what makes it safe to enter one at all.
 *  Malformed folders are skipped too - they carry no route to open a
 *  position with. */
function expandChildren(routeNode: RouteNode, insideSlot: Set<RouteNode>): RouteNode[] {
  if (routeNode.type === 'catchall')
    return []
  const nested = routeNode.type === 'slot' || insideSlot.has(routeNode)
  return routeNode.children.filter(child => child.type !== 'malformed' && !(nested && child.type === 'slot'))
}

// ── positions ───────────────────────────────────────────────────────────

function createSearchNode(routeNode: RouteNode, parent: SearchNode): SearchNode {
  const type = routeNode.type
  const node: SearchNode = {
    urlDepth: parent.urlDepth + +isUrlConsuming(type),
    staticness: parent.staticness - +isDynamicOrCatchall(type),
    depth: parent.depth + 1,
    fallback: undefined as never, // filled by setEndpoints, once every position exists
  }
  if (isDynamicOrCatchall(type))
    node.param = routeNode.segment
  if (type === 'catchall')
    node.isCatchall = true
  return node
}

/** This position's conflict-tracking record, creating it on first touch. */
function conflictsFor(position: SearchNode, conflictsOf: Map<SearchNode, PositionConflicts>): PositionConflicts {
  return conflictsOf.getOrInsertComputed(position, () => ({
    pages: [],
    defaults: new Set<RouteNode>(),
    dynamics: dict<RouteNode>(),
    catchalls: [],
  }))
}

/** Opens a declared slot, registering it on the POSITION rather than the
 *  folder - a slot inside a group belongs to the position the group folds
 *  into, so two folders that collapse onto the same position and both
 *  declare the same slot name merge into one rather than conflicting. Roots
 *  its own match path (depth 0), but shares the position's urlDepth since a
 *  slot consumes no URL segment of its own. */
function openSlot(routeNode: RouteNode, position: SearchNode, slotsOf: Map<SearchNode, Record<string, SearchNode>>): SearchNode {
  const slots = slotsOf.getOrInsertComputed(position, dict<SearchNode>)
  const existing = slots[routeNode.segment]
  if (existing) return existing

  const slotNode = createSearchNode(routeNode, position)
  slotNode.depth = 0
  return slots[routeNode.segment] = slotNode
}

/** Gets the position a folder belongs to, creating it if it doesn't exist
 *  yet - a group just returns the one already there (its parent's), while
 *  everything else looks up or opens its own. */
function getOrCreatePosition(
  routeNode: RouteNode,
  parent: SearchNode,
  conflictsOf: Map<SearchNode, PositionConflicts>,
  slotsOf: Map<SearchNode, Record<string, SearchNode>>,
): SearchNode {
  switch (routeNode.type) {
    default: // group
      return parent
    case 'static':
      parent.statics ??= dict<SearchNode>()
      return parent.statics[routeNode.segment] ??= createSearchNode(routeNode, parent)
    case 'dynamic':
      conflictsFor(parent, conflictsOf).dynamics[routeNode.segment] ??= routeNode
      return parent.dynamic ??= createSearchNode(routeNode, parent)
    case 'catchall':
      conflictsFor(parent, conflictsOf).catchalls.push(routeNode)
      return parent.catchall ??= createSearchNode(routeNode, parent)
    case 'slot':
      return openSlot(routeNode, parent, slotsOf)
  }
}

// ── build ───────────────────────────────────────────────────────────────

export function createSearchTree(routeTree: RouteNode): [SearchNode, PositionConflicts[]] {
  const searchTree: SearchNode = {
    urlDepth: 0,
    staticness: 0,
    depth: 0,
    fallback: undefined as never, //* Must be populated later
  }
  const searchNodes = new Set([searchTree]) // every search node position in depth-first order
  const conflictsOf = new Map<SearchNode, PositionConflicts>() // traversal-only; setEndpoints never reads it
  const insideSlot = new Set<RouteNode>() // folders sitting within a slot subtree; traversal-only too
  const ctx: SearchContext = {
    positionOf: new Map([[routeTree, searchTree]]), // seeded, so every child can read its parent's
    pageOwnerOf: new Map<SearchNode, RouteNode>(),
    defaultOwnerOf: new Map<SearchNode, RouteNode>(),
    slotsOf: new Map<SearchNode, Record<string, SearchNode>>(),
  }
  traverse(routeTree, {
    visit: (routeNode) => { // the folder's own contribution: does it own this position's page, and/or its default?
      const searchNode = ctx.positionOf.get(routeNode)!
      // A real default always beats an implicit one at the boundary
      // There also can't be multiple defaults in the same position
      const defaultOwner = findDefaultOwner(routeNode)
      if (!ctx.defaultOwnerOf.has(searchNode) || defaultOwner.modules.default)
        ctx.defaultOwnerOf.set(searchNode, defaultOwner)

      // Several folders can climb to the same real default without
      // conflicting - only distinct owners count as competing claims.
      if (defaultOwner.modules.default)
        conflictsFor(searchNode, conflictsOf).defaults.add(defaultOwner)

      if (!routeNode.modules.page) return // after this, routeNode is a page owner
      ctx.pageOwnerOf.getOrInsert(searchNode, routeNode)
      conflictsFor(searchNode, conflictsOf).pages.push(routeNode)
    },
    expand: routeNode => expandChildren(routeNode, insideSlot),
    attach: (childRouteNode, parentRouteNode) => {
      if (parentRouteNode.type === 'slot' || insideSlot.has(parentRouteNode))
        insideSlot.add(childRouteNode)

      const parentSearchNode = ctx.positionOf.get(parentRouteNode)!
      const childSearchNode = getOrCreatePosition(childRouteNode, parentSearchNode, conflictsOf, ctx.slotsOf)
      ctx.positionOf.set(childRouteNode, childSearchNode)
      searchNodes.add(childSearchNode)
    },
  })
  for (const searchNode of searchNodes)
    setEndpoints(searchNode, ctx)
  return [searchTree, [...conflictsOf.values()]]
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
const [root, conflicts] = createSearchTree(routeTree)
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
