import type { RouteNode, RouteModuleType } from '../compiling/route-tree'
import type { MatchPathParams, MatchPath } from './match-path'
import { getRoutePath, getRouteNodeParentIfNotSlot } from '../compiling/route-tree'
import { getMatchPathParams } from './match-path'

type PageOrDefaultRenderLeaf = {
  type: 'leaf'
  moduleType: 'page' | 'default'
  path: string
  sourcePath: string
  params: MatchPathParams
}

type NotFoundRenderLeaf = {
  type: 'leaf'
  moduleType: 'notfound'
  path: string
  sourcePath: string
}

export type RenderLeaf =
  | PageOrDefaultRenderLeaf
  | NotFoundRenderLeaf

/** Pairs a public RenderLeaf with the RouteNode it came from - the latter
 *  is only needed internally, to seed the wrap-and-climb walk up to root. */
type RenderLeafResult = { routeNode: RouteNode; leaf: RenderLeaf }

function findNearestModuleRouteNode(routeNode: RouteNode, moduleType: RouteModuleType): RouteNode | undefined {
  for (let node: RouteNode | undefined = routeNode; node; node = getRouteNodeParentIfNotSlot(node)) {
    if (node.modulePaths.has(moduleType))
      return node
  }
}

/** A default.tsx renders at a real segment position, so - like a real
 *  Next default.tsx - it gets the params resolved up to the point of the
 *  miss; not-found.tsx can be reached from anywhere with no reliable
 *  segment context, so it gets none. */
function findFallbackRenderLeaf(routeNode: RouteNode, matchPath: MatchPath, mainParams: MatchPathParams): RenderLeafResult | undefined {
  const defaultRouteNode = findNearestModuleRouteNode(routeNode, 'default')
  if (defaultRouteNode)
    return {
      routeNode: defaultRouteNode,
      leaf: {
        type: 'leaf',
        moduleType: 'default',
        path: getRoutePath(defaultRouteNode),
        sourcePath: defaultRouteNode.modulePaths.get('default')!,
        params: getMatchPathParams(matchPath, mainParams),
      },
    }
  const notFoundRouteNode = findNearestModuleRouteNode(routeNode, 'not-found')
  if (notFoundRouteNode)
    return {
      routeNode: notFoundRouteNode,
      leaf: {
        type: 'leaf',
        moduleType: 'notfound',
        path: getRoutePath(notFoundRouteNode),
        sourcePath: notFoundRouteNode.modulePaths.get('not-found')!,
      },
    }
}

/** Interprets a walked MatchPath: what it resolved to, using the same
 *  priority order createMatchPath's own traversal already used to pick it -
 *  a real page or catch-all if the position IS one, otherwise the nearest
 *  fallback climbing from there. Returns the originating RouteNode alongside
 *  the public leaf, since callers need it to climb up to root. */
export function createRenderLeaf(matchPath: MatchPath, url: string[], mainParams: MatchPathParams): RenderLeafResult | undefined {
  const searchNode = matchPath.searchNode
  const urlExhausted = searchNode.index === url.length

  if (urlExhausted && searchNode.page) {
    const routeNode = searchNode.page
    const params = getMatchPathParams(matchPath, mainParams)  // mainParams carries main-tree params in, since a slot's own chain never links back to it
    return { routeNode, leaf: { type: 'leaf', moduleType: 'page', path: getRoutePath(routeNode), sourcePath: routeNode.modulePaths.get('page')!, params } }
  }
  else if (!urlExhausted && searchNode.catchall) {
    const routeNode = searchNode.catchall
    const param = routeNode.segment.value
    const urlTail = url.slice(searchNode.index)
    const params = { ...getMatchPathParams(matchPath, mainParams), [param]: urlTail }
    return { routeNode, leaf: { type: 'leaf', moduleType: 'page', path: getRoutePath(routeNode), sourcePath: routeNode.modulePaths.get('page')!, params } }
  }
  else
    return findFallbackRenderLeaf(searchNode.routeNode, matchPath, mainParams)
}
