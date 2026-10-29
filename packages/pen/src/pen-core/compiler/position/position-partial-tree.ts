import type { RouteNode } from '@/pen-core/compiler/route'
import type { Claims } from './position-claims'
import type { Ownership } from './position-ownership'
import { dict } from '@/lib/record'
import { traverse } from '@/lib/traverse'
import { isUrlConsuming, isDynamicOrCatchall } from '@/pen-core/compiler/route'
import { createClaims, addClaims } from './position-claims'
import { addOwnership } from './position-ownership'

export type PartialPositionNode = {
  urlDepth: number      // url segments consumed to reach this position
  dynamicCount: number  // dynamic/catchall segments from root to here
  param?: string        // dynamic param/s captured at this position, only for dynamic/catch-all
  // Children
  statics?: Record<string, PartialPositionNode>
  dynamic?: PartialPositionNode
  catchall?: PartialPositionNode
}

/** Context needed by position-tree construction to track route-to-position mappings and declared slots. */
type PositionContext = {
  positionOf: Map<RouteNode, PartialPositionNode>              // route -> the position it belongs to
  slotsOf: Map<RouteNode, Record<string, PartialPositionNode>> // route -> its declared slots, by name
}

function isTraversable(route: RouteNode) {
  if (route.type === 'malformed') return false
  if (route.type !== 'slot') return true
  for (let ancestor = route.parent; ancestor; ancestor = ancestor.parent)
    if (ancestor.type === 'slot') return false
  return true
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

/** Represents a URL position in the route tree before rendering information is attached. */
export function createPartialPositionTree(routeTree: RouteNode) {
  const positionTree: PartialPositionNode = { urlDepth: 0, dynamicCount: 0 }
  const context: PositionContext = {
    positionOf: new Map([[routeTree, positionTree]]),
    slotsOf: new Map(),
  }
  const claimsOf = new Map<PartialPositionNode, Claims>() // map of all position nodes and their claims
  const ownershipOf = new Map<PartialPositionNode, Ownership>()

  traverse(routeTree, {
    visit: (route) => {
      const position = context.positionOf.get(route)!
      addOwnership(ownershipOf.getOrInsert(position, {}), route)
      addClaims(claimsOf.getOrInsertComputed(position, createClaims), route)
    },
    expand: (route) => {
      return route.type === 'catchall' ? [] :
        route.children.filter(isTraversable)
    },
    attach: (childRoute) => {
      const childPosition = getOrCreatePosition(childRoute, context)
      context.positionOf.set(childRoute, childPosition)
    },
  })
  return [positionTree, claimsOf, ownershipOf, context.slotsOf] as const
}
