import type { ReactElement } from 'react'
import type { RoutingTable } from './composer'
import { composeRoute } from './composer'

export type RouteResolver = (url: string) => ReactElement

export function createRouteResolver(routingTable: RoutingTable): RouteResolver {
  const elementCache: Record<string, ReactElement> = {}

  const resolveRoute: RouteResolver = (url) => {
    if (elementCache[url]) return elementCache[url]

    const { routeChainMap } = routingTable

    // 1. Exact match (static routes always win)
    if (routeChainMap[url]) {
      elementCache[url] = composeRoute(url, routingTable, {})
      return elementCache[url]
    }

    // 2. Dynamic match — try each pattern with params
    for (const [pattern, route] of Object.entries(routeChainMap)) {
      if (route.params.length === 0) continue // skip static patterns
      const params = matchDynamic(url, pattern, route.params)
      if (params !== null) {
        elementCache[url] = composeRoute(pattern, routingTable, params)
        return elementCache[url]
      }
    }

    // 3. No match — composeRoute will throw NotFoundError
    return composeRoute(url, routingTable, {})
  }

  return resolveRoute
}

/**
 * Tries to match a concrete URL against a pattern that may contain `:param` segments.
 * Returns the extracted params on success, or null if the URL doesn't match.
 */
export function matchDynamic(
  url: string,
  pattern: string,
  paramNames: string[],
): Record<string, string> | null {
  if (paramNames.length === 0) return null // not a dynamic pattern

  const urlParts = url.split('/').filter(Boolean)
  const patternParts = pattern.split('/').filter(Boolean)

  if (urlParts.length !== patternParts.length) return null

  const params: Record<string, string> = {}
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i]!
    const urlPart = urlParts[i]!

    if (patternPart.startsWith(':')) {
      const name = patternPart.slice(1)
      if (!paramNames.includes(name)) return null
      params[name] = decodeURIComponent(urlPart)
    } else if (patternPart !== urlPart) {
      return null
    }
  }
  return params
}
