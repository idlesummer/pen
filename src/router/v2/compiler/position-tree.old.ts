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

function createPositionNode(route: RouteNode, parent: PositionNode): PositionNode {
  const type = route.type
  const position: PositionNode = {
    urlDepth: parent.urlDepth + +isUrlConsuming(type),
    staticness: parent.staticness - +isDynamicOrCatchall(type),
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
 *  Groups reuse their parent's position; other folders create their own.
 *  Takes parentRoute rather than the parent position itself, and looks the
 *  position up via context.positionOf - the slot case needs parentRoute
 *  anyway (slots register against the real folder that declares them, not
 *  whatever position it collapses onto), so deriving parent from it here
 *  means the caller doesn't have to look it up just to hand it over. */
function getOrCreatePosition(route: RouteNode, parentRoute: RouteNode, state: TraversalState, context: PositionContext): PositionNode {
  const parent = context.positionOf.get(parentRoute)!
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
      const slotDict = context.slotsOf.getOrInsertComputed(parentRoute, dict<PositionNode>)
      const slotName = route.segment
      return slotDict[slotName] ??= createPositionNode(route, parent)
    }
  }
}

// ── build ───────────────────────────────────────────────────────────────

export function createPositionTree(routeTree: RouteNode): [PositionNode, PositionConflicts[]] {
  const positionTree: PositionNode = {
    urlDepth: 0,
    staticness: 0,
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
    slotsOf: new Map<RouteNode, Record<string, PositionNode>>(),
  }
  traverse(routeTree, {
    visit: (route) => { // the folder's own contribution: does it own this position's page, and/or its default?
      const position = context.positionOf.get(route)!
      const defaultOwnerOf = context.defaultOwnerOf
      // A real default always beats an implicit one at the boundary
      // There also can't be multiple defaults in the same position
      const defaultOwner = findDefaultOwner(route)
      if (!defaultOwnerOf.has(position) || defaultOwner.modules.default)
        defaultOwnerOf.set(position, defaultOwner)

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
    attach: (childRoute, parentRoute) => {
      if (parentRoute.type === 'slot' || state.slotDescendants.has(parentRoute))
        state.slotDescendants.add(childRoute)

      const childPosition = getOrCreatePosition(childRoute, parentRoute, state, context)
      context.positionOf.set(childRoute, childPosition)
      positions.add(childPosition)
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
  │   │   ├── default.tsx
  │   │   └── @related/
  │   │       └── page.tsx
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
  // @related sits below one dynamic ancestor ([id]). Its own params should
  // include id, continuing straight through the slot boundary rather than
  // restarting at 0 there - verified against a real Next.js build.
  'blog/[id]/@related/page.tsx',
  'blog/[slug]/page.tsx',
  'blog/[...rest]/page.tsx',
  'blog/[...rest]/dead/page.tsx',
  '[bad/page.tsx',
  // (a)/dashboard and dashboard collapse onto one position but are disjoint
  // in the real tree. @panel here should NEVER reach dashboard/layout.tsx,
  // even though they share a URL - confirmed against a real Next.js build:
  // a route-group sibling that never wins page ownership for a position
  // doesn't get its slots passed anywhere either. Kept as a negative case.
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
