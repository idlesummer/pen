import type { RouteNode } from '@/pen-core/compiler/route'

export type PositionOwnership = {
  page?: RouteNode
  default?: RouteNode
}

/** Resolves the position's default and page owners using single-owner semantics.
 *
 *  @param ownership - The position's current ownership record.
 *  @param route - The route being processed. */
export function addOwnership(ownership: PositionOwnership, route: RouteNode) {
  // Assign if empty or if the route has an explicit default
  if (!ownership.default || route.defaultFallback.modules.default)
    ownership.default = route.defaultFallback

  // First page owner wins (multiple owners are invalid)
  if (!ownership.page && route.modules.page)
    ownership.page = route
}
