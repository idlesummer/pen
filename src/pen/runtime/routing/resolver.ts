import type { ReactElement } from 'react'
import type { RoutingTable } from './composer'
import { composeRoute } from './composer'

export type RouteResolver = (url: string) => ReactElement

export function createRouteResolver(routingTable: RoutingTable): RouteResolver {
  const elementCache: Record<string, ReactElement> = {}
  const resolveRoute: RouteResolver = (url) =>
    (elementCache[url] ??= composeRoute(url, routingTable))

  return resolveRoute
}
