import type { RouteNode } from '@/pen-core/compiler/route'
import type { Frame, PositionClaims, PositionContext, PositionNode } from './position'
import { dict } from '@/lib/dict'
import { traverse } from '@/lib/traverse'
import { createClaims, trackOwnership } from './position-ownership'
import { isDynamicOrCatchall, isUrlConsuming } from '../route/route-segment'

type PositionTreeResult = {
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
function expandChildren(route: RouteNode, slotDescendants: Set<RouteNode>): RouteNode[] {
  if (route.type === 'catchall') return []
  const isSlotNested = route.type === 'slot' || slotDescendants.has(route)
  const children: RouteNode[] = []

  for (const child of route.children)
    if (child.type !== 'malformed' && !(child.type === 'slot' && isSlotNested))
      children.push(child)
  return children
}

// ── positions ────────────────────────────────────────────────────────────

function createPositionNode(route: RouteNode, parent: PositionNode): PositionNode {
  const type = route.type
  const position: PositionNode = {
    urlDepth: parent.urlDepth + +isUrlConsuming(type),
    dynamicCount: parent.dynamicCount + +isDynamicOrCatchall(type),
    fallback: undefined as never, //* filled by resolvePositionEndpoints, once every position exists
  }
  if (isDynamicOrCatchall(type))
    position.param = route.segment
  return position
}

/** Gets or creates the position for a route folder. Groups reuse their parent's position; other folders create their own. */
function getOrCreatePosition(route: RouteNode, parentRoute: RouteNode, context: PositionContext): [child: PositionNode, parent: PositionNode, type?: 'dynamics' | 'catchalls'] {
  const parentPosition = context.positionOf.get(parentRoute)!

  switch (route.type) {
    default: // group
      return [parentPosition, parentPosition]
    case 'static':
      parentPosition.statics ??= dict<PositionNode>()
      return [parentPosition.statics[route.segment] ??= createPositionNode(route, parentPosition), parentPosition]
    case 'dynamic':
      return [parentPosition.dynamic ??= createPositionNode(route, parentPosition), parentPosition, 'dynamics']
    case 'catchall':
      return [parentPosition.catchall ??= createPositionNode(route, parentPosition), parentPosition, 'catchalls']
    case 'slot': {
      const slotsOf = context.slotsOf
      const slotDict = slotsOf.getOrInsertComputed(parentRoute, dict<PositionNode>)
      return [slotDict[route.segment] ??= createPositionNode(route, parentPosition), parentPosition]
    }
  }
}

// ── build ────────────────────────────────────────────────────────────────

export function createPositionTree(routeTree: RouteNode): PositionTreeResult {
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
    expand: route => expandChildren(route, slotDescendants),
    attach: (childRoute, parentRoute) => {
      const [childPosition, parentPosition, claimType] = getOrCreatePosition(childRoute, parentRoute, context)
      if (claimType) {
        const claims = claimsOf.getOrInsertComputed(parentPosition, createClaims)
        claims[claimType].push(childRoute) // add to claims if dynamic/catchall
      }
      context.positionOf.set(childRoute, childPosition)
      positions.add(childPosition)
    },
  })
  const conflicts = [...claimsOf.values()]
  return { positionTree, positions, conflicts, context }
}
