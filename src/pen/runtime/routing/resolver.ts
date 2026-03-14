import type { ReactElement } from 'react'
import type { DynamicParams } from '../providers/DynamicParamsProvider'
import type { RoutingTable } from './composer'
import { composeRoute } from './composer'

export type RouteResolver = (url: string) => RouteMatch
export type RouteMatch = {
  element: ReactElement
  params: Record<string, string>
}

export function createRouteResolver(routingTable: RoutingTable): RouteResolver {
  const { routeChainMap } = routingTable
  const elementCache: Record<string, RouteMatch> = {}

  const resolveRoute: RouteResolver = (url) => {
    if (elementCache[url])
      return elementCache[url]

    // 1. Exact match (static routes always win)
    if (routeChainMap[url]) {
      const element = composeRoute(url, routingTable)
      return (elementCache[url] = { element, params: {} })
    }

    // 2. Dynamic match — try each pattern with params
    for (const [pattern, route] of Object.entries(routeChainMap)) {
      if (route.params.length === 0) // skip static patterns
        continue

      const params = matchDynamic(url, pattern, route.params)
      if (params !== null) {
        const element = composeRoute(pattern, routingTable)
        return (elementCache[url] = { element, params })
      }
    }

    // 3. No match — composeRoute will throw NotFoundError
    const element = composeRoute(url, routingTable)
    return ({ element, params: {} })
  }

  return resolveRoute
}

/**
 * Tries to match a concrete URL against a pattern that may contain `:param` segments.
 * Returns the extracted params on success, or null if the URL doesn't match.
 */
export function matchDynamic(url: string, pattern: string, paramNames: string[]): DynamicParams | null {
  if (paramNames.length === 0)
    return null // not a dynamic pattern

  const urlParts = url.slice(1, -1).split('/')  // trim leading and trailing slashes
  const patternParts = pattern.slice(1, -1).split('/')
  if (urlParts.length !== patternParts.length)
    return null

  const params: DynamicParams = {}
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i]!
    const urlPart = urlParts[i]!

    if (patternPart.startsWith(':'))
      params[patternPart.slice(1)] = decodeURIComponent(urlPart)

    else if (patternPart !== urlPart)
      return null
  }
  return params
}
