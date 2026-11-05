import type { RouteNode } from '@/pen-core/compiler/route'

export type Ownership = {
  page?: RouteNode
  fallback?: RouteNode
}

/** Resolves the position's fallback and page owners using single-owner semantics.
 *
 *  @param ownership - The position's current ownership record.
 *  @param route - The route being processed. */
export function addOwnership(ownership: Ownership, route: RouteNode) {
  // Assign if empty or if the route has an explicit fallback
  if (!ownership.fallback || route.fallback.modules.fallback)
    ownership.fallback = route.fallback

  // First page owner wins (multiple owners are invalid)
  if (!ownership.page && route.modules.page)
    ownership.page = route
}
