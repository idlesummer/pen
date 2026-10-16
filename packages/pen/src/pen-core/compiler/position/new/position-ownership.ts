import type { RouteNode } from '@/pen-core/compiler/route'

export type PositionOwnership = {
  page?: RouteNode
  default?: RouteNode
}

/**
 * Resolves the position's default and page owners using single-owner semantics.
 *
 * @param ownership - The position's current ownership record.
 * @param route - The route being processed.
 * @param defaultOwner - The nearest default-owning route for the current route.
 */
export function addOwnership(ownership: PositionOwnership, route: RouteNode, defaultOwner: RouteNode) {
  // Assign if empty or if the route has an explicit default
  if (!ownership.default || defaultOwner.modules.default)
    ownership.default = defaultOwner

  // First page owner wins (multiple owners are invalid)
  if (!ownership.page && route.modules.page)
    ownership.page = route
}
