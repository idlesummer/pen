import type { RouteNode } from '@/pen-core/compiler/route/route-tree'

export type Ownership = {
  page?: RouteNode
  default?: RouteNode
}

export function createOwnership(): Ownership {
  return {}
}

/** Resolves this position's real default/page owner (single-owner semantics). */
export function addOwnership(ownership: Ownership, route: RouteNode, defaultOwner: RouteNode) {
  if (defaultOwner.modules.default || !ownership.default)
    ownership.default = defaultOwner
  if (route.modules.page && !ownership.page) // there should be only one page owner
    ownership.page = route
}
