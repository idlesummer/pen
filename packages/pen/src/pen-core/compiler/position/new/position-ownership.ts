import type { RouteNode } from '@/pen-core/compiler/route/route-tree'

export type Ownership<P> = {
  pageOwnerOf: Map<P, RouteNode>
  defaultOwnerOf: Map<P, RouteNode>
}

export function createOwnership<P>(): Ownership<P> {
  return { pageOwnerOf: new Map(), defaultOwnerOf: new Map() }
}

/** Resolves this position's real default/page owner (single-owner semantics). */
export function addOwnership<P>(ownership: Ownership<P>, route: RouteNode, defaultOwner: RouteNode, position: P) {
  if (defaultOwner.modules.default || !ownership.defaultOwnerOf.has(position))
    ownership.defaultOwnerOf.set(position, defaultOwner)
  if (route.modules.page) // there should be only one page owner
    ownership.pageOwnerOf.getOrInsert(position, route)
}
