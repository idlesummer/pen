import type { RouteNode } from '@/pen-core/compiler/route'
import type { Endpoint, Frame, PositionClaims, PositionContext, PositionNode } from './position'
import { dict } from '@/lib/dict'
import { traverse } from '@/lib/traverse'
import { createPositionEndpoints } from './position-endpoints'
import { createClaims, trackOwnership } from './position-ownership'
import { isDynamicOrCatchall, isUrlConsuming } from '../route/route-segment'

export type PositionTreeData = {
  positionTree: PositionNode
  modulePaths: string[]
  conflicts: PositionClaims[]
  pageEndpoints: Endpoint[]
}

type PositionSkeleton = {
  positionTree: PositionNode
  positions: Set<PositionNode>
  conflicts: PositionClaims[]
  context: PositionContext
}

// ── traversal ────────────────────────────────────────────────────────────

/** Every folder nested inside a slot subtree - computed once, up front, since
 *  it's purely a function of route-tree shape and doesn't depend on anything
 *  position-related. */
function findSlotDescendants(routeTree: RouteNode): Set<RouteNode> {
  const descendants = new Set<RouteNode>()
  traverse(routeTree, {
    expand: route => route.children,
    attach: (childRoute, parentRoute) => {
      if (parentRoute.type === 'slot' || descendants.has(parentRoute))
        descendants.add(childRoute)
    },
  })
  return descendants
}

/** Skips malformed folders, stops at catch-alls, and prevents nested slots. */
function expand(route: RouteNode, slotDescendants: Set<RouteNode>): RouteNode[] {
  if (route.type === 'catchall') return []
  const isSlotNested = route.type === 'slot' || slotDescendants.has(route)
  const children: RouteNode[] = []

  for (const child of route.children)
    if (child.type !== 'malformed' && !(child.type === 'slot' && isSlotNested))
      children.push(child)
  return children
}

// ── positions ────────────────────────────────────────────────────────────

function createPosition(route: RouteNode, parent: PositionNode): PositionNode {
  const routeType = route.type
  const position: PositionNode = {
    urlDepth: parent.urlDepth + +isUrlConsuming(routeType),
    dynamicCount: parent.dynamicCount + +isDynamicOrCatchall(routeType),
    fallback: undefined as never, //* filled by createPositionEndpoints, once every position exists
  }
  if (isDynamicOrCatchall(routeType))
    position.param = route.segment
  return position
}

/** Gets or creates the position for a route folder. Groups reuse their parent's position; other folders create their own. */
function getOrCreatePosition(route: RouteNode, context: PositionContext): [child: PositionNode, type?: 'dynamics' | 'catchalls'] {
  const parentRoute = route.parent!
  const parentPosition = context.positionOf.get(parentRoute)!
  const slotsOf = context.slotsOf

  switch (route.type) {
    default:         return [parentPosition]  // group
    case 'static':   return [(parentPosition.statics ??= dict())[route.segment] ??= createPosition(route, parentPosition)]
    case 'dynamic':  return [parentPosition.dynamic ??= createPosition(route, parentPosition), 'dynamics']
    case 'catchall': return [parentPosition.catchall ??= createPosition(route, parentPosition), 'catchalls']
    case 'slot':     return [slotsOf.getOrInsertComputed(parentRoute, dict)[route.segment] ??= createPosition(route, parentPosition)]
  }
}

// ── build ────────────────────────────────────────────────────────────────

/** Collects all unique module paths used by the position tree's endpoints and frames, including slots. */
function getModulePaths(positions: Set<PositionNode>): string[] {
  const modules = new Set<string>()

  for (const position of positions) {
    for (const endpoint of [position.endpoint, position.fallback]) {
      if (!endpoint) continue

      modules.add(endpoint.contentPath)
      for (const { layout, loading, error, default: default_ } of endpoint.frames) {
        if (layout)   modules.add(layout)
        if (loading)  modules.add(loading)
        if (error)    modules.add(error)
        if (default_) modules.add(default_)
      }
    }
  }
  return [...modules].sort()
}

/** Collects real page endpoints, excluding fallbacks that render sentinels. */
function getPageEndpoints(positions: Set<PositionNode>): Endpoint[] {
  const endpoints: Endpoint[] = []
  for (const position of positions)
    if (position.endpoint)
      endpoints.push(position.endpoint)
  return endpoints
}

function createPositionSkeleton(routeTree: RouteNode): PositionSkeleton {
  const positionTree: PositionNode = {
    urlDepth: 0,
    dynamicCount: 0,
    fallback: undefined as never, //* Must be populated later
  }
  const positions = new Set([positionTree]) // every position node, in depth-first order
  const slotDescendants = findSlotDescendants(routeTree)
  const claimsOf = new Map<PositionNode, PositionClaims>()
  const context: PositionContext = {
    positionOf: new Map([[routeTree, positionTree]]), // seeded, so every child can read its parent's
    pageOwnerOf: new Map<PositionNode, RouteNode>(),
    defaultOwnerOf: new Map<PositionNode, RouteNode>(),
    slotsOf: new Map<RouteNode, Record<string, PositionNode>>(),
    frameOf: new Map<RouteNode, Frame>(),
    fallbackFrameOf: new Map<Frame, Frame>(),
  }
  traverse(routeTree, {
    visit: (route) => {
      const position = context.positionOf.get(route)!
      trackOwnership(route, position, context, claimsOf)
    },
    expand: route => expand(route, slotDescendants),
    attach: (childRoute) => {
      const [childPosition, claimType] = getOrCreatePosition(childRoute, context)
      if (claimType) {
        const parentPosition = context.positionOf.get(childRoute.parent!)!
        claimsOf.getOrInsertComputed(parentPosition, createClaims)[claimType].push(childRoute) // add to claims if dynamic/catchall
      }
      context.positionOf.set(childRoute, childPosition)
      positions.add(childPosition)
    },
  })
  const conflicts = [...claimsOf.values()]
  return { positionTree, positions, conflicts, context }
}

export function createPositionTree(routeTree: RouteNode): PositionTreeData {
  const { positionTree, positions, conflicts, context } = createPositionSkeleton(routeTree)
  for (const position of positions) {
    const { endpoint, fallback } = createPositionEndpoints(position, context)
    position.endpoint = endpoint
    position.fallback = fallback
  }
  const modulePaths = getModulePaths(positions)
  const pageEndpoints = getPageEndpoints(positions)
  return { positionTree, conflicts, modulePaths, pageEndpoints }
}
