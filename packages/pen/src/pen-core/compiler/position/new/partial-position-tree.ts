import type { RouteNode } from '@/pen-core/compiler/route'
import type { PositionClaims } from './position-claims'
import { dict } from '@/lib/dict'
import { traverse } from '@/lib/traverse'
import { findDefaultOwner, findSlotDescendants } from '@/pen-core/compiler/route/route-tree'
import { isUrlConsuming, isDynamicOrCatchall } from '@/pen-core/compiler/route/route-segment'
import { addClaims, addDynamicOrCatchallClaim } from './position-claims'
import { createOwnership, addOwnership } from './position-ownership'

type PartialPositionNode = {
  urlDepth: number      // url segments consumed to reach this position
  dynamicCount: number  // dynamic/catchall segments from root to here
  param?: string        // dynamic param/s captured at this position, only for dynamic/catch-all
  // Children
  statics?: Record<string, PartialPositionNode>
  dynamic?: PartialPositionNode
  catchall?: PartialPositionNode
}

type PositionContext = {
  positionOf: Map<RouteNode, PartialPositionNode>              // route -> the position it belongs to
  slotsOf: Map<RouteNode, Record<string, PartialPositionNode>> // route -> its declared slots, by name
}

function createPositionContext(routeTree: RouteNode, positionTree: PartialPositionNode): PositionContext {
  return {
    positionOf: new Map([[routeTree, positionTree]]),
    slotsOf: new Map<RouteNode, Record<string, PartialPositionNode>>(),
  }
}

function isTraversable(route: RouteNode, slotDescendants: Set<RouteNode>) {
  if (route.type === 'malformed') return false
  if (route.type !== 'slot') return true
  return route.parent!.type !== 'slot' && !slotDescendants.has(route.parent!)
}

function createPosition(route: RouteNode, parent: PartialPositionNode): PartialPositionNode {
  const routeType = route.type
  const urlDepth = parent.urlDepth + +isUrlConsuming(routeType)
  const dynamicCount = parent.dynamicCount + +isDynamicOrCatchall(routeType)
  const position: PartialPositionNode = { urlDepth, dynamicCount }

  if (isDynamicOrCatchall(routeType))
    position.param = route.segment
  return position
}

/** Gets or creates the position for a route folder. Groups reuse their parent's position; other folders create their own. */
function getOrCreatePosition(route: RouteNode, context: PositionContext): PartialPositionNode {
  const parentRoute = route.parent!
  const parentPosition = context.positionOf.get(parentRoute)!
  const slotsOf = context.slotsOf

  switch (route.type) {
    default:         return parentPosition  // group
    case 'static':   return (parentPosition.statics ??= dict())[route.segment] ??= createPosition(route, parentPosition)
    case 'dynamic':  return parentPosition.dynamic ??= createPosition(route, parentPosition)
    case 'catchall': return parentPosition.catchall ??= createPosition(route, parentPosition)
    case 'slot':     return slotsOf.getOrInsertComputed(parentRoute, dict)[route.segment] ??= createPosition(route, parentPosition)
  }
}

export function createPartialPositionTree(routeTree: RouteNode) {
  const positionTree: PartialPositionNode = { urlDepth: 0, dynamicCount: 0 }
  const positions = new Set([positionTree])
  const context = createPositionContext(routeTree, positionTree)
  const claimsOf = new Map<PartialPositionNode, PositionClaims>()
  const ownership = createOwnership<PartialPositionNode>()
  const slotDescendants = findSlotDescendants(routeTree)

  traverse(routeTree, {
    visit: (route) => {
      const position = context.positionOf.get(route)!
      const defaultOwner = findDefaultOwner(route)  // an explicit default beats fallback boundary default
      addClaims(claimsOf, position, route, defaultOwner)
      addOwnership(ownership, route, defaultOwner, position)
    },
    expand: (route) => {
      if (route.type !== 'catchall')
        return route.children.filter(child => isTraversable(child, slotDescendants))
      return []
    },
    attach: (childRoute, parentRoute) => {
      const childPosition = getOrCreatePosition(childRoute, context)
      context.positionOf.set(childRoute, childPosition)
      positions.add(childPosition)

      const parentPosition = context.positionOf.get(parentRoute)!
      addDynamicOrCatchallClaim(claimsOf, parentPosition, childRoute)
    },
  })
  const conflicts = [...claimsOf.values()]
  return [positionTree, positions, conflicts, ownership]
}
