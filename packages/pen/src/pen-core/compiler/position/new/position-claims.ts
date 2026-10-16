import type { RouteNode } from '@/pen-core/compiler/route/route-tree'

export type PositionClaims = {
  page: RouteNode[]      // routes with a page collapsed into this position
  default: RouteNode[]   // default-owning ancestors found by routes collapsed into this position
  dynamic: RouteNode[]   // dynamic routes collapsed into this position
  catchall: RouteNode[]  // catchall routes collapsed into this position
}

export function createClaims(): PositionClaims {
  return { page: [], default: [], dynamic: [], catchall: [] }
}

/** Records this route's page/default ownership claim. */
export function addClaims(claims: PositionClaims, route: RouteNode, defaultOwner: RouteNode) {
  if (defaultOwner.modules.default) // records the position's explicit default owners
    claims.default.push(defaultOwner)
  if (route.modules.page)     // records a position's page owner
    claims.page.push(route)  // if there's multiple, it's recorded here
}

/** Records a dynamic/catchall route's naming claim at its parent's claims. */
export function addDynamicOrCatchallClaim(claims: PositionClaims, route: RouteNode) {
  if (route.type === 'dynamic' || route.type === 'catchall')
    claims[route.type].push(route)
}
