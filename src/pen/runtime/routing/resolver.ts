import type { ReactElement } from 'react'
import type { RoutingTable } from './composer'
import { composeRoute } from './composer'

export type RouteResolver = (url: string) => ReactElement
export function buildRoutes(routingTable: RoutingTable): RouteResolver {
  const cache: Record<string, ReactElement> = {}
  const resolveRoute: RouteResolver = (url) =>
    (cache[url] ??= composeRoute(url, routingTable))

  return resolveRoute
}
