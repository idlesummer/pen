import type { RouteNode } from '@/pen-core/compiler/route'
import type { PositionClaims, PositionContext, PositionNode } from './position'
import { dict } from '@/lib/dict'
import { findDefaultOwner } from '../route/route-tree'

export function createConflicts(): PositionClaims {
  return {
    pages: [],
    defaults: new Set<RouteNode>(),
    dynamics: dict<RouteNode>(),
    catchalls: [],
  }
}

/** Records a folder's ownership claim at its position - does it own the page
 *  here, and/or the nearest real default - and tracks competing claims for
 *  conflict reporting. Requires the folder's own position to already exist. */
export function trackOwnership(route: RouteNode, position: PositionNode, context: PositionContext, conflictsOf: Map<PositionNode, PositionClaims>) {
  const defaultOwnerOf = context.defaultOwnerOf
  // A real default always beats an implicit one at the boundary
  const defaultOwner = findDefaultOwner(route)
  if (!defaultOwnerOf.has(position) || defaultOwner.modules.default)
    defaultOwnerOf.set(position, defaultOwner)

  // Several folders can climb to the same real default without
  // conflicting - only distinct owners count as competing claims.
  if (defaultOwner.modules.default)
    conflictsOf.getOrInsertComputed(position, createConflicts).defaults.add(defaultOwner)

  if (!route.modules.page) return // after this, route is a page owner
  context.pageOwnerOf.getOrInsert(position, route)
  conflictsOf.getOrInsertComputed(position, createConflicts).pages.push(route)
}
