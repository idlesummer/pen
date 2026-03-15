import type { ReactElement } from 'react'
import type { DynamicParams } from '../providers/DynamicParamsProvider'
import type { RoutingTable } from './composer'
import { composeRoute, composeNearestAncestorRoute } from './composer'

export type RouteResolver = (url: string) => RouteMatch
export type RouteMatch = {
  element: ReactElement
  params?: DynamicParams
}

export function createRouteResolver(routingTable: RoutingTable): RouteResolver {
  const { routeChainMap } = routingTable
  const routeMatchCache: Record<string, RouteMatch> = {}  // persisting cache for new matches

  const resolveRoute: RouteResolver = (url) => {
    if (routeMatchCache[url])
      return routeMatchCache[url]

    // 1. Exact match (static routes always win)
    if (routeChainMap[url]) {
      const element = composeRoute(url, routingTable)
      return (routeMatchCache[url] = { element })
    }

    // 2. Dynamic match — try each pattern with params
    const urlSegments = toSegments(url)
    for (const routePattern of Object.keys(routeChainMap)) {
      if (!routePattern.includes(':'))
        continue

      const routeSegments = toSegments(routePattern)
      const params = matchDynamicRoutePattern(urlSegments, routeSegments)
      if (params !== null) {
        const element = composeRoute(routePattern, routingTable)
        return (routeMatchCache[url] = { element, params })
      }
    }

    // 3. No match — walk up to find nearest ancestor with a not-found boundary
    const element = composeNearestAncestorRoute(url, routingTable)
    return (routeMatchCache[url] = { element })
  }

  return resolveRoute
}

/**
 * Tries to match URL segments against a pattern that may contain `:param` segments.
 * Returns the extracted params on success, or null if the URL doesn't match.
 * Note: only call this for patterns that contain at least one `:param` segment.
 */
export function matchDynamicRoutePattern(urlSegments: string[], routeSegments: string[]): DynamicParams | null {
  if (urlSegments.length !== routeSegments.length)
    return null

  const params: DynamicParams = {}
  for (let i = 0; i < routeSegments.length; i++) {
    const urlSegment = urlSegments[i]!
    const routeSegment = routeSegments[i]!

    if (routeSegment.startsWith(':'))
      params[routeSegment.slice(1)] = urlSegment

    else if (urlSegment !== routeSegment)
      return null
  }
  return params
}

/** Splits a URL into its path segments, expecting leading and trailing slashes (e.g. `/users/42/`). */
function toSegments(url: string): string[] {
  return url.slice(1, -1).split('/')
}
