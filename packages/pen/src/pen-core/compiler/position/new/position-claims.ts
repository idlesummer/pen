import type { RouteNode } from '@/pen-core/compiler/route'

export type PositionClaims = {
  page: RouteNode[]      // routes with a page collapsed into this position
  default: RouteNode[]   // default-owning ancestors found by routes collapsed into this position
  dynamic: RouteNode[]   // dynamic routes collapsed into this position
  catchall: RouteNode[]  // catchall routes collapsed into this position
}

export function createClaims(): PositionClaims {
  return { page: [], default: [], dynamic: [], catchall: [] }
}

/** Records page, default, dynamic, and catchall claims for this position. */
export function addClaims(claims: PositionClaims, route: RouteNode) {
  // records a position's page owner;
  // a valid tree should only have one per position
  if (route.modules.page)
    claims.page.push(route)

  // records the position's explicit default owners
  if (route.defaultFallback.modules.default)
    claims.default.push(route.defaultFallback)

  // records the position's dynamic or catchall routes;
  // a valid tree should only have one per position
  if (route.type === 'dynamic' || route.type === 'catchall')
    claims[route.type].push(route)
}
