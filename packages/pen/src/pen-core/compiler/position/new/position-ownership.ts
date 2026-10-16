import type { RouteNode } from '@/pen-core/compiler/route'

export type PositionOwnership = {
  page?: RouteNode
  default?: RouteNode
}

/** Resolves this position's real default/page owner (single-owner semantics). */
export function addOwnership(ownership: PositionOwnership, route: RouteNode, defaultOwner: RouteNode) {
  if (defaultOwner.modules.default || !ownership.default)
    ownership.default = defaultOwner
  if (route.modules.page && !ownership.page) // there should be only one page owner
    ownership.page = route
}
