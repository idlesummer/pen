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

/** Traversal-only bookkeeping */
type TraversalState = {
  conflictsOf: Map<SearchNode, PositionConflicts>
  slotDescendants: Set<RouteNode> // folders sitting within a slot subtree
}

/** This folder's own nearest real default - itself, if it declares one or is
 *  a boundary, otherwise the nearest ancestor that does. */
function findDefaultOwner(route: RouteNode): RouteNode {
  for (let node = route; ; node = node.parent!) {
    if (node.modules.default || isBoundary(node.type))
      return node
  }
}

/** The children worth walking: a catch-all is terminal, and once inside a
 *  slot, a further nested slot is excluded - slot subtrees are terminal for
 *  further slot-nesting, which is what makes it safe to enter one at all.
 *  Malformed folders are skipped too - they carry no route to open a
 *  position with. */
function expandChildren(route: RouteNode, state: TraversalState): RouteNode[] {
  if (route.type === 'catchall')
    return []
  const isSlotNested = route.type === 'slot' || state.slotDescendants.has(route)
  const children: RouteNode[] = []

  for (const child of route.children) {
    if (child.type !== 'malformed' && !(child.type === 'slot' && isSlotNested))
      children.push(child)
  }
  return children
}

// ── positions ───────────────────────────────────────────────────────────

function createSearchNode(route: RouteNode, parent: SearchNode, depth?: number): SearchNode {
  const type = route.type
  const node: SearchNode = {
    urlDepth: parent.urlDepth + +isUrlConsuming(type),
    staticness: parent.staticness - +isDynamicOrCatchall(type),
    depth: depth ?? parent.depth + 1,
    fallback: undefined as never, // filled by setEndpoints, once every position exists
  }
  if (isDynamicOrCatchall(type))
    node.param = route.segment
  if (type === 'catchall')
    node.isCatchall = true
  return node
}

/** This position's conflict-tracking record, creating it on first touch. */
function conflictsFor(position: SearchNode, state: TraversalState): PositionConflicts {
  return state.conflictsOf.getOrInsertComputed(position, () => ({
    pages: [],
    defaults: new Set<RouteNode>(),
    dynamics: dict<RouteNode>(),
    catchalls: [],
  }))
}

/** Gets the position a folder belongs to, creating it if it doesn't exist
 *  yet - a group just returns the one already there (its parent's), while
 *  everything else looks up or opens its own. slotsOf stays a separate param
 *  rather than joining TraversalState - it's SearchContext's, shared with
 *  search-tree-endpoints.ts, not traversal-only like state is. */
function getOrCreatePosition(route: RouteNode, parent: SearchNode, state: TraversalState, slotsOf: Map<SearchNode, Record<string, SearchNode>>): SearchNode {
  switch (route.type) {
    default: // group
      return parent
    case 'static':
      parent.statics ??= dict<SearchNode>()
      return parent.statics[route.segment] ??= createSearchNode(route, parent)
    case 'dynamic':
      conflictsFor(parent, state).dynamics[route.segment] ??= route
      return parent.dynamic ??= createSearchNode(route, parent)
    case 'catchall':
      conflictsFor(parent, state).catchalls.push(route)
      return parent.catchall ??= createSearchNode(route, parent)
    case 'slot': {
      const slotDict = slotsOf.getOrInsertComputed(parent, dict<SearchNode>)
      const slotName = route.segment
      return slotDict[slotName] ??= createSearchNode(route, parent, 0)
    }
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
  const state: TraversalState = { conflictsOf: new Map(), slotDescendants: new Set() }
  const ctx: SearchContext = {
    positionOf: new Map([[routeTree, searchTree]]), // seeded, so every child can read its parent's
    pageOwnerOf: new Map<SearchNode, RouteNode>(),
    defaultOwnerOf: new Map<SearchNode, RouteNode>(),
    slotsOf: new Map<SearchNode, Record<string, SearchNode>>(),
  }
  traverse(routeTree, {
    visit: (route) => { // the folder's own contribution: does it own this position's page, and/or its default?
      const searchNode = ctx.positionOf.get(route)!
      // A real default always beats an implicit one at the boundary
      // There also can't be multiple defaults in the same position
      const defaultOwner = findDefaultOwner(route)
      if (!ctx.defaultOwnerOf.has(searchNode) || defaultOwner.modules.default)
        ctx.defaultOwnerOf.set(searchNode, defaultOwner)

      // Several folders can climb to the same real default without
      // conflicting - only distinct owners count as competing claims.
      if (defaultOwner.modules.default)
        conflictsFor(searchNode, state).defaults.add(defaultOwner)

      if (!route.modules.page) return // after this, route is a page owner
      ctx.pageOwnerOf.getOrInsert(searchNode, route)
      conflictsFor(searchNode, state).pages.push(route)
    },
    expand: route => expandChildren(route, state),
    attach: (childRouteNode, parentRouteNode) => {
      if (parentRouteNode.type === 'slot' || state.slotDescendants.has(parentRouteNode))
        state.slotDescendants.add(childRouteNode)

      const parentSearchNode = ctx.positionOf.get(parentRouteNode)!
      const childSearchNode = getOrCreatePosition(childRouteNode, parentSearchNode, state, ctx.slotsOf)
      ctx.positionOf.set(childRouteNode, childSearchNode)
      searchNodes.add(childSearchNode)
    },
  })
  for (const searchNode of searchNodes)
    setEndpoints(searchNode, ctx)
  return [searchTree, [...state.conflictsOf.values()]]
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
  ├── (a)/
  │   └── dashboard/
  │       ├── layout.tsx
  │       └── @panel/
  │           └── page.tsx
  ├── dashboard/
  │   ├── layout.tsx
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
  // (a)/dashboard and dashboard collapse onto one position, disjoint in the
  // real tree - dashboard/page.tsx's own ancestry never visits (a)/dashboard,
  // so this only comes out right if @panel is looked up by position rather
  // than attached to whichever of the two folders happened to open it first.
  '(a)/dashboard/layout.tsx',
  '(a)/dashboard/@panel/page.tsx',
  'dashboard/layout.tsx',
  'dashboard/page.tsx',
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
