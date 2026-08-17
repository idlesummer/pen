import type { RouteNode, RouteModuleType } from './route-tree.js'
import type { MatchPathParams, MatchPath } from './match-path.js'
import { getRouteNodeParentIfNotSlot } from './route-tree.js'
import { getMatchPathParams } from './match-path.js'

type PageOrDefaultRenderLeaf = {
  moduleRouteNode: RouteNode
  type: 'leaf'
  moduleType: 'page' | 'default'
  params: MatchPathParams
}

type NotFoundRenderLeaf = {
  moduleRouteNode: RouteNode
  type: 'leaf'
  moduleType: 'notfound'
}

export type RenderLeaf =
  | PageOrDefaultRenderLeaf
  | NotFoundRenderLeaf

function findNearestModuleRouteNode(routeNode: RouteNode, moduleType: RouteModuleType): RouteNode | undefined {
  for (let node: RouteNode | undefined = routeNode; node; node = getRouteNodeParentIfNotSlot(node)) {
    if (node.modulePaths.has(moduleType))
      return node
  }
}

/** A default.tsx renders at a real segment position, so - like a real
 *  Next.js default.tsx - it gets the params resolved up to the point of the
 *  miss; not-found.tsx can be reached from anywhere with no reliable
 *  segment context, so it gets none. */
function findFallbackRenderLeaf(routeNode: RouteNode, matchPath: MatchPath, mainParams: MatchPathParams): RenderLeaf | undefined {
  const defaultRouteNode = findNearestModuleRouteNode(routeNode, 'default')
  if (defaultRouteNode)
    return {
      moduleRouteNode: defaultRouteNode,
      type: 'leaf',
      moduleType: 'default',
      params: getMatchPathParams(matchPath, mainParams),
    }
  const notFoundRouteNode = findNearestModuleRouteNode(routeNode, 'not-found')
  if (notFoundRouteNode)
    return {
      moduleRouteNode: notFoundRouteNode,
      type: 'leaf',
      moduleType: 'notfound',
    }
}

/** Interprets a walked MatchPath: what it resolved to, using the same
 *  priority order createMatchPath's own traversal already used to pick it -
 *  a real page or catch-all if the position IS one, otherwise the nearest
 *  fallback climbing from there. */
export function createRenderLeaf(matchPath: MatchPath, url: string[], mainParams: MatchPathParams): RenderLeaf | undefined {
  const searchNode = matchPath.searchNode
  const urlExhausted = searchNode.index === url.length

  if (urlExhausted && searchNode.page) {
    const moduleRouteNode = searchNode.page
    const params = getMatchPathParams(matchPath, mainParams)  // mainParams carries main-tree params in, since a slot's own chain never links back to it
    return { moduleRouteNode, type: 'leaf', moduleType: 'page', params }
  }
  else if (!urlExhausted && searchNode.catchall) {
    const moduleRouteNode = searchNode.catchall
    const param = searchNode.catchall.segment.value
    const urlTail = url.slice(searchNode.index)
    const params = { ...getMatchPathParams(matchPath, mainParams), [param]: urlTail }
    return { moduleRouteNode, type: 'leaf', moduleType: 'page', params }
  }
  else
    return findFallbackRenderLeaf(searchNode.routeNode, matchPath, mainParams)
}
