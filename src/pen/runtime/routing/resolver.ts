import type { ReactElement } from 'react'
import type { RouteTreeNode } from '@/pen/compiler'
import type { DynamicParams } from '../providers/DynamicParamsProvider'
import type { RoutingTable } from './composer'
import { composeSegmentLayerChain } from './composer'
import { buildSegmentLayerChain } from './chainer'
import { matchRoutePath } from './matcher'
import { NotFoundError } from '../errors'

export type RouteResolver = (url: string) => RouteMatch
export type RouteMatch = {
  element: ReactElement
  params?: DynamicParams
}

export function createRouteResolver({ routeTree, pathComponentMap }: RoutingTable): RouteResolver {
  const routeMatchCache: Record<string, RouteMatch> = {}
  const resolveRoute: RouteResolver = (url) => {
    // 1, Return cached element
    if (routeMatchCache[url])
      return routeMatchCache[url]

    const segments = toSegments(url)
    const { routePath, partial } = matchRoutePath(routeTree, segments)

    // 2. Create element if not cached
    if (!partial) {
      const chain = buildSegmentLayerChain(routePath)
      const element = composeSegmentLayerChain(chain, pathComponentMap, url)
      const params = extractParams(routePath, segments)
      const match: RouteMatch = Object.keys(params).length ? { element, params } : { element }
      return (routeMatchCache[url] = match)
    }

    // No match — walk back from deepest matched node to find nearest ancestor
    // with a not-found boundary, then render that ancestor's chain (screen stripped
    // so NotFoundError is thrown and caught by the boundary).
    for (let i = routePath.length-1; i >= 0; i--) {
      const ancestorChain = buildSegmentLayerChain(routePath.slice(0, i+1))
      if (!ancestorChain.some(layer => layer['not-found']))
        continue

      const params = extractParams(routePath, segments)
      const element = composeSegmentLayerChain(ancestorChain, pathComponentMap, url, true)
      const match: RouteMatch = Object.keys(params).length ? { element, params } : { element }
      return (routeMatchCache[url] = match)
    }
    throw new NotFoundError(url)
  }

  return resolveRoute
}

/** Splits a URL into its path segments, expecting leading and trailing slashes (e.g. `/users/42/`). */
function toSegments(url: string): string[] {
  const inner = url.slice(1, -1)  // strip leading and trailing slashes
  return inner ? inner.split('/') : []
}

/** Derives dynamic params by walking the matched path and segments together. */
function extractParams(routePath: RouteTreeNode[], segments: string[]): DynamicParams {
  const params: DynamicParams = {}
  let idx = 0
  for (let i=1; i < routePath.length; i++) {  // skip root
    const node = routePath[i]!
    if (node.group) continue
    if (node.param) params[node.param] = segments[idx]!
    idx++
  }
  return params
}
