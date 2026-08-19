import type { RouteNode, RouteModuleType } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree'
import type { MatchPathParams, MatchPath } from './match-path'
import { getRoutePath, getRouteNodeParentIfNotSlot } from '../compiling/route-tree'
import { createMatchPath, getMatchPathParams } from './match-path'

type RenderLeaf = {
  moduleType: RouteModuleType // page, default, or not-found
  modulePath: string
  routePath: string
  params?: MatchPathParams
}

type SlotRenderNodes = Record<string, RenderNode>  // Actual name is SlotRenderNode
type ShellRenderNode = {
  path: string
  layout?: string
  loading?: string
  error?: string
  slots: SlotRenderNodes & { children: RenderNode }
}

export type RenderNode =
  | RenderLeaf
  | ShellRenderNode

function findNearestModuleRouteNode(routeNode: RouteNode, moduleType: RouteModuleType): RouteNode | undefined {
  for (let node: RouteNode | undefined = routeNode; node; node = getRouteNodeParentIfNotSlot(node)) {
    if (node.modulePaths.has(moduleType))
      return node
  }
}

function createModuleRenderLeaf(moduleType: RouteModuleType, routeNode: RouteNode, params?: MatchPathParams): [RouteNode, RenderLeaf] {
  const modulePath = routeNode.modulePaths.get(moduleType)!
  const routePath = getRoutePath(routeNode)
  const renderLeaf: RenderLeaf = { moduleType, modulePath, routePath, params }
  return [routeNode, renderLeaf]
}

/** A default.tsx renders at a real segment position, so - like a real
 *  Next default.tsx - it gets the params resolved up to the point of the
 *  miss; not-found.tsx can be reached from anywhere with no reliable
 *  segment context, so it gets none. */
function findFallbackRenderLeaf(routeNode: RouteNode, matchPath: MatchPath, mainParams: MatchPathParams): [RouteNode, RenderLeaf] | undefined {
  const defaultRouteNode = findNearestModuleRouteNode(routeNode, 'default')
  if (defaultRouteNode) return createModuleRenderLeaf('default', defaultRouteNode, getMatchPathParams(matchPath, mainParams))

  const notfoundRouteNode = findNearestModuleRouteNode(routeNode, 'not-found')
  if (notfoundRouteNode) return createModuleRenderLeaf('not-found', notfoundRouteNode)
}

/** Interprets a walked MatchPath: what it resolved to, using the same
 *  priority order createMatchPath's own traversal already used to pick it -
 *  a real page or catch-all if the position IS one, otherwise the nearest
 *  fallback climbing from there. Returns the originating RouteNode alongside
 *  the leaf, since callers need it to climb up to root. */
function createRenderLeaf(matchPath: MatchPath, url: string[], mainParams: MatchPathParams): [RouteNode, RenderLeaf] | undefined {
  const searchNode = matchPath.searchNode
  const urlExhausted = searchNode.index === url.length
  const routeNode = urlExhausted ? searchNode.page : searchNode.catchall

  // Return fallback if matching searchNode page or catchall doesn't exist
  if (!routeNode)
    return findFallbackRenderLeaf(searchNode.routeNode, matchPath, mainParams)

  // Else then create a render leaf and attach params
  const params = getMatchPathParams(matchPath, mainParams)
  if (!urlExhausted) {
    const paramName = routeNode.segment.value
    params[paramName] = url.slice(searchNode.index) // gather the remaining url since its a catchall
  }
  return createModuleRenderLeaf('page', routeNode, params)
}

function getSlotMatchPathsByRouteNode(matchPathLeaf: MatchPath): Map<RouteNode, MatchPath> {
  const slotMatchPaths = new Map<RouteNode, MatchPath>()
  for (let matchPath: MatchPath | undefined = matchPathLeaf; matchPath; matchPath = matchPath.parent) {
    if (matchPath.searchNode.slots)
      slotMatchPaths.set(matchPath.searchNode.routeNode, matchPath)
  }
  return slotMatchPaths
}

function wrapRenderNode(routeNode: RouteNode, childRenderNode: RenderNode, extraSlots?: SlotRenderNodes): RenderNode {
  const layout = routeNode.modulePaths.get('layout')
  const loading = routeNode.modulePaths.get('loading')
  const error = routeNode.modulePaths.get('error')

  return (!layout && !loading && !error && !extraSlots) ? childRenderNode : {
    path: getRoutePath(routeNode),
    layout, loading, error,
    slots: { ...extraSlots, children: childRenderNode },
  }
}

function createRenderNodeChain(routeNode: RouteNode, renderLeaf: RenderNode): RenderNode {
  let renderNode = renderLeaf
  for (let node: RouteNode | undefined = routeNode; node; node = getRouteNodeParentIfNotSlot(node))
    renderNode = wrapRenderNode(node, renderNode)
  return renderNode
}

function createSlotRenderNodes(matchPathStep: MatchPath, url: string[]): SlotRenderNodes | undefined {
  const searchNode = matchPathStep.searchNode
  const mainParams = getMatchPathParams(matchPathStep, {})
  const slotRenderNodes: SlotRenderNodes = {}

  for (const [slotName, slotSearchTree] of searchNode.slots ?? []) {
    const slotMatchPath = createMatchPath(slotSearchTree, url)
    const result = createRenderLeaf(slotMatchPath, url, mainParams)
    if (result) slotRenderNodes[slotName] = createRenderNodeChain(...result)
  }
  if (Object.keys(slotRenderNodes).length)
    return slotRenderNodes
}

function createRenderNodeChainWithSlots(routeNode: RouteNode, mainRenderLeaf: RenderNode, url: string[], slotMatchPaths: Map<RouteNode, MatchPath>): RenderNode {
  let renderNode = mainRenderLeaf

  // For each route node in the match path leaf
  for (let node: RouteNode | undefined = routeNode; node; node = node.parent) {
    const slotMatchPath = slotMatchPaths.get(node)
    const slotRenderNodes = slotMatchPath && createSlotRenderNodes(slotMatchPath, url)
    renderNode = wrapRenderNode(node, renderNode, slotRenderNodes)
  }
  return renderNode
}

/** Returns whether the main children route matched a real page, together with
 *  the render tree. `success` is false for default/notfound fallbacks and when
 *  nothing can be rendered. */
export function createRenderTree(urlString: string, searchTree: SearchNode): [success: boolean, renderTree?: RenderNode] {
  const url = urlString.split('/').filter(Boolean)       // Convert url string to a list of segments
  const mainMatchPath = createMatchPath(searchTree, url) // Find search node path with params that match the url
  const mainResult = createRenderLeaf(mainMatchPath, url, {}) // Create the initial render node leaf
  if (!mainResult) return [false]                        // Return nothing if not even a fallback exists

  const [mainRouteNode, mainRenderLeaf] = mainResult
  const slotMatchPaths = getSlotMatchPathsByRouteNode(mainMatchPath) // Map each ancestor route node to its own slot match path, if it has one
  const renderTree = createRenderNodeChainWithSlots(mainRouteNode, mainRenderLeaf, url, slotMatchPaths) // Create main render chain
  return [mainRenderLeaf.moduleType === 'page', renderTree]
}
