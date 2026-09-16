import type { RouteNode } from './route-tree'
import type { PositionConflicts, PositionContext, PositionNode } from './position-node'
import { dict } from '@/lib/dict'
import { traverse } from '@/lib/traverse'
import { createRouteTree, findDefaultOwner } from './route-tree'
import { setEndpoints } from './position-tree-endpoints'
import { isDynamicOrCatchall, isUrlConsuming } from './route-segment'

// ── routing rules over the route tree ──────────────────────────────────────
// This stops at slot boundaries, which is a statement about how routing
// inherits rather than about folders - so it lives here, not in route-tree.

/** Traversal-only bookkeeping */
type TraversalState = {
  conflictsOf: Map<PositionNode, PositionConflicts>
  slotDescendants: Set<RouteNode> // folders sitting within a slot subtree
}

/** Skips malformed folders, stops at catch-alls, and prevents nested slots. */
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

function createPositionNode(route: RouteNode, parent: PositionNode, depth?: number): PositionNode {
  const type = route.type
  const position: PositionNode = {
    urlDepth: parent.urlDepth + +isUrlConsuming(type),
    staticness: parent.staticness - +isDynamicOrCatchall(type),
    depth: depth ?? parent.depth + 1,
    fallback: undefined as never, // filled by setEndpoints, once every position exists
  }
  if (isDynamicOrCatchall(type))
    position.param = route.segment
  if (type === 'catchall')
    position.isCatchall = true
  return position
}

function createConflicts(): PositionConflicts {
  return { pages: [], defaults: new Set(), dynamics: dict(), catchalls: [] }
}

/** Gets or creates the position for a route folder.
 *  Groups reuse their parent's position; other folders create their own. */
function getOrCreatePosition(route: RouteNode, parent: PositionNode, state: TraversalState, context: PositionContext): PositionNode {
  const conflictsOf = state.conflictsOf
  switch (route.type) {
    default: // group
      return parent
    case 'static':
      parent.statics ??= dict<PositionNode>()
      return parent.statics[route.segment] ??= createPositionNode(route, parent)
    case 'dynamic':
      conflictsOf.getOrInsertComputed(parent, createConflicts).dynamics[route.segment] ??= route
      return parent.dynamic ??= createPositionNode(route, parent)
    case 'catchall':
      conflictsOf.getOrInsertComputed(parent, createConflicts).catchalls.push(route)
      return parent.catchall ??= createPositionNode(route, parent)
    case 'slot': {
      const slotDict = context.slotsOf.getOrInsertComputed(parent, dict<PositionNode>)
      const slotName = route.segment
      return slotDict[slotName] ??= createPositionNode(route, parent, 0)
    }
  }
}

// ── build ───────────────────────────────────────────────────────────────

export function createPositionTree(routeTree: RouteNode): [PositionNode, PositionConflicts[]] {
  const positionTree: PositionNode = {
    urlDepth: 0,
    staticness: 0,
    depth: 0,
    fallback: undefined as never, //* Must be populated later
  }
  const positions = new Set([positionTree]) // every position node, in depth-first order
  const state: TraversalState = {
    conflictsOf: new Map<PositionNode, PositionConflicts>(),
    slotDescendants: new Set<RouteNode>(),
  }
  const context: PositionContext = {
    positionOf: new Map([[routeTree, positionTree]]), // seeded, so every child can read its parent's
    pageOwnerOf: new Map<PositionNode, RouteNode>(),
    defaultOwnerOf: new Map<PositionNode, RouteNode>(),
    slotsOf: new Map<PositionNode, Record<string, PositionNode>>(),
  }
  traverse(routeTree, {
    visit: (route) => { // the folder's own contribution: does it own this position's page, and/or its default?
      const position = context.positionOf.get(route)!
      // A real default always beats an implicit one at the boundary
      // There also can't be multiple defaults in the same position
      const defaultOwner = findDefaultOwner(route)
      if (!context.defaultOwnerOf.has(position) || defaultOwner.modules.default)
        context.defaultOwnerOf.set(position, defaultOwner)

      // Several folders can climb to the same real default without
      // conflicting - only distinct owners count as competing claims.
      const conflictsOf = state.conflictsOf
      if (defaultOwner.modules.default)
        conflictsOf.getOrInsertComputed(position, createConflicts).defaults.add(defaultOwner)

      if (!route.modules.page) return // after this, route is a page owner
      context.pageOwnerOf.getOrInsert(position, route)
      conflictsOf.getOrInsertComputed(position, createConflicts).pages.push(route)
    },
    expand: route => expandChildren(route, state),
    attach: (childRouteNode, parentRouteNode) => {
      if (parentRouteNode.type === 'slot' || state.slotDescendants.has(parentRouteNode))
        state.slotDescendants.add(childRouteNode)

      const parentPositionNode = context.positionOf.get(parentRouteNode)!
      const childPositionNode = getOrCreatePosition(childRouteNode, parentPositionNode, state, context)
      context.positionOf.set(childRouteNode, childPositionNode)
      positions.add(childPositionNode)
    },
  })
  for (const position of positions)
    setEndpoints(position, context)
  return [positionTree, [...state.conflictsOf.values()]]
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
const [root, conflicts] = createPositionTree(routeTree)
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
