import type { ReactElement } from 'react'
import type { RouteNode } from '@/pen/compiler'
import type { DynamicParams } from '../providers/DynamicParamsProvider'
import type { RoutingTable } from './composer'
import { composeSegmentLayerChain, composeNotFoundChain } from './composer'
import { buildSegmentLayerChain } from './chainer'
import { matchRoutePath } from './matcher'
import { NotFoundError } from '../errors'

export type RouteResolver = (url: string) => RouteMatch
export type RouteMatch = {
  element: ReactElement
  params?: DynamicParams
}

export function createRouteResolver({ routeTree, componentMap }: RoutingTable): RouteResolver {
  const routeMatchCache: Record<string, RouteMatch> = {}
  return (url) => {
    // 1. Return cached element
    if (routeMatchCache[url])
      return routeMatchCache[url]

    const segments = toSegments(url)
    const { routePath, hasMatch } = matchRoutePath(routeTree, segments)
    const chain = buildSegmentLayerChain(routePath)
    const params = extractParams(routePath, segments)

    // 2. Create element if not cached
    if (hasMatch) {
      const element = composeSegmentLayerChain(chain, componentMap, url)
      const hasParams = Object.keys(params).length
      return (routeMatchCache[url] = hasParams ? { element, params } : { element })
    }

    // 3. No full match - find nearest ancestor with a not-found boundary and render it.
    const notFoundIdx = chain.findIndex(layer => layer['not-found'])
    if (notFoundIdx !== -1) {
      const element = composeNotFoundChain(chain.slice(notFoundIdx), componentMap, url)
      const hasParams = Object.keys(params).length
      return (routeMatchCache[url] = hasParams ? { element, params } : { element })
    }

    // 4. Let root not-found boundary catch
    throw new NotFoundError(url)
  }
}

/** Splits a URL into its path segments, expecting leading and trailing slashes (e.g. `/users/42/`). */
function toSegments(url: string): string[] {
  const inner = url.slice(1, -1)  // strip leading and trailing slashes
  return inner ? inner.split('/') : []
}

/** Derives dynamic params by walking the matched path and segments together. */
function extractParams(routePath: RouteNode[], segments: string[]): DynamicParams {
  const params: DynamicParams = {}
  let idx = 0
  for (let i=1; i < routePath.length; i++) {  // skip root
    const routeNode = routePath[i]!
    if (routeNode.type === 'group') continue
    if (routeNode.type === 'required-catchall' || routeNode.type === 'optional-catchall') {
      params[routeNode.param!] = segments.slice(idx)
      break
    }
    if (routeNode.param) params[routeNode.param] = segments[idx]!
    idx++
  }
  return params
}
