import type { RouteNode } from './route-tree'
import type { Frame, PositionConflicts, PositionContext, PositionNode } from './position-node'
import { dict } from '@/lib/dict'
import { traverse } from '@/lib/traverse'
import { findDefaultOwner } from './route-tree'
import { setEndpoints } from './position-tree-endpoints'
import { isDynamicOrCatchall, isUrlConsuming } from './route-segment'

// ── traversal ────────────────────────────────────────────────────────────

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

// ── positions ────────────────────────────────────────────────────────────

function createPositionNode(route: RouteNode, parent: PositionNode): PositionNode {
  const type = route.type
  const position: PositionNode = {
    urlDepth: parent.urlDepth + +isUrlConsuming(type),
    staticness: parent.staticness - +isDynamicOrCatchall(type),
    fallback: undefined as never, //* filled by setEndpoints, once every position exists
  }
  if (isDynamicOrCatchall(type))
    position.param = route.segment
  return position
}

function createConflicts(): PositionConflicts {
  return { pages: [], defaults: new Set(), dynamics: dict(), catchalls: [] }
}

/** Gets or creates the position for a route folder.
 *  Groups reuse their parent's position; other folders create their own. */
function getOrCreatePosition(route: RouteNode, parentRoute: RouteNode, state: TraversalState, context: PositionContext): PositionNode {
  const parentPosition = context.positionOf.get(parentRoute)!
  const conflictsOf = state.conflictsOf
  switch (route.type) {
    default: // group
      return parentPosition
    case 'static':
      parentPosition.statics ??= dict<PositionNode>()
      return parentPosition.statics[route.segment] ??= createPositionNode(route, parentPosition)
    case 'dynamic':
      conflictsOf.getOrInsertComputed(parentPosition, createConflicts).dynamics[route.segment] ??= route
      return parentPosition.dynamic ??= createPositionNode(route, parentPosition)
    case 'catchall':
      conflictsOf.getOrInsertComputed(parentPosition, createConflicts).catchalls.push(route)
      return parentPosition.catchall ??= createPositionNode(route, parentPosition)
    case 'slot': {
      const slotDict = context.slotsOf.getOrInsertComputed(parentRoute, dict<PositionNode>)
      return slotDict[route.segment] ??= createPositionNode(route, parentPosition)
    }
  }
}

// ── build ────────────────────────────────────────────────────────────────

export function createPositionTree(routeTree: RouteNode): [PositionNode, PositionConflicts[], PositionNode[]] {
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
    frameOf: new Map<RouteNode, Frame | undefined>(),
    fallbackFrameOf: new Map<Frame, Frame>(),
  }
  traverse(routeTree, {
    visit: (route) => { // the folder's own contribution: does it own this position's page, and/or its default?
      const position = context.positionOf.get(route)!
      const defaultOwnerOf = context.defaultOwnerOf
      // A real default always beats an implicit one at the boundary
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

  return [positionTree, [...state.conflictsOf.values()], [...positions]]
}

// ── modules ──────────────────────────────────────────────────────────────

/** Every module the compiled tree can actually render, for the component map.
 *  Takes createPositionTree's own flat positions list rather than re-walking
 *  from the root: that list already includes every slot subtree (their route
 *  nodes get attached during the same traversal that built it), which the
 *  structural statics/dynamic/catchall shape alone can't reach - a module in
 *  a branch nothing can reach is not emitted as a dead import either way. */
export function getModulePaths(positions: Iterable<PositionNode>): string[] {
  const modules = new Set<string>()
  for (const position of positions) {
    for (const endpoint of [position.endpoint, position.fallback]) {
      if (!endpoint) continue
      modules.add(endpoint.content)
      for (const { layout, loading, error, default: _default } of endpoint.frames) {
        if (layout)   modules.add(layout)
        if (loading)  modules.add(loading)
        if (error)    modules.add(error)
        if (_default) modules.add(_default)
      }
    }
  }
  return [...modules].sort()
}
