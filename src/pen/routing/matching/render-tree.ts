import type { RouteNode, RouteModuleType } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree'
import type { ParamTable, MatchPath } from './match-path'
import { getRoutePath, getRouteNodeParentIfNotSlot, findDefaultRouteNodeParent } from '../compiling/route-tree'
import { createMatchPath, getParamTable, getSlotMatchPaths } from './match-path'

type RenderLeaf = {
  moduleType: RouteModuleType // page or default
  modulePath: string
  routePath: string
  paramTable: ParamTable
}

type SlotRenderNodes = Record<string, RenderNode>  // contains SlotRenderNode
export type RenderNode = RenderLeaf | {
  routePath: string
  layout?: string
  loading?: string
  error?: string
  slots: SlotRenderNodes
}

function createModuleRenderLeaf(moduleType: RouteModuleType, routeNode: RouteNode, paramTable: ParamTable): [RenderLeaf, RouteNode] {
  const modulePath = routeNode.modulePaths.get(moduleType)!
  const routePath = getRoutePath(routeNode)
  const renderLeaf: RenderLeaf = { moduleType, modulePath, routePath, paramTable }
  return [renderLeaf, routeNode]
}

function createRenderLeaf(matchPath: MatchPath, mainParamTable: ParamTable): [RenderLeaf, RouteNode] | undefined {
  const acceptingNode = matchPath.acceptingNode
  if (!acceptingNode) {
    const defaultNode = findDefaultRouteNodeParent(matchPath.searchNode.anchor)
    const paramTable = { ...mainParamTable, ...getParamTable(matchPath) }
    return defaultNode && createModuleRenderLeaf('default', defaultNode, paramTable)
  }
  const paramTable = { ...mainParamTable, ...getParamTable(matchPath) }
  if (matchPath.catchallParamValues) {
    const catchallName = acceptingNode.segment.value
    paramTable[catchallName] = matchPath.catchallParamValues
  }
  return createModuleRenderLeaf('page', acceptingNode, paramTable)
}

function wrapRenderNode(routeNode: RouteNode, childRenderNode: RenderNode, slotRenderNodes?: SlotRenderNodes): RenderNode {
  const layout = routeNode.modulePaths.get('layout')
  const loading = routeNode.modulePaths.get('loading')
  const error = routeNode.modulePaths.get('error')
  if (!layout && !loading && !error && !slotRenderNodes)
    return childRenderNode

  const routePath = getRoutePath(routeNode)
  const slots = slotRenderNodes ?? {} // warn users to not modify prototype chain
  slots.children = childRenderNode
  return { routePath, layout, loading, error, slots }
}

function createRenderNodeChain(renderLeaf: RenderNode, routeNode: RouteNode): RenderNode {
  let renderNode = renderLeaf
  for (let node: RouteNode | undefined = routeNode; node; node = getRouteNodeParentIfNotSlot(node))
    renderNode = wrapRenderNode(node, renderNode)
  return renderNode
}

function createSlotRenderNodes(matchPath: MatchPath, url: string[]): SlotRenderNodes | undefined {
  const searchNode = matchPath.searchNode
  const mainParamTable = getParamTable(matchPath)
  const slotRenderNodes: SlotRenderNodes = {}  // NOTE: never modity prototype chain

  for (const [slotName, slotSearchTree] of searchNode.slots ?? []) {
    const slotMatchPath = createMatchPath(slotSearchTree, url)
    const result = createRenderLeaf(slotMatchPath, mainParamTable)
    if (result) slotRenderNodes[slotName] = createRenderNodeChain(...result)
  }
  for (const _ in slotRenderNodes)  // a bit more efficent than Object.keys(...).length
    return slotRenderNodes
}

function createMainRenderNodeChain(mainRenderLeaf: RenderNode, routeNode: RouteNode, url: string[], slotMatchPaths: Map<RouteNode, MatchPath>): RenderNode {
  let renderNode = mainRenderLeaf
  for (let node: RouteNode | undefined = routeNode; node; node = node.parent) { // Walk each RouteNode from the RenderLeaf toward the root
    const slotMatchPath = slotMatchPaths.get(node)
    const slots = slotMatchPath && createSlotRenderNodes(slotMatchPath, url)
    renderNode = wrapRenderNode(node, renderNode, slots)
  }
  return renderNode
}

/** Returns whether the main children route matched a real page, together with
 *  the render tree. `success` is false for default fallbacks and when nothing
 *  can be rendered. */
export function createRenderTree(urlString: string, searchTree: SearchNode): [success: boolean, renderTree?: RenderNode] {
  const url = urlString.split('/')                       // Convert url string to a list of segments; url[0] is always '' (root's own position)
  const mainMatchPath = createMatchPath(searchTree, url) // Find search node path with params that match the url
  const mainResult = createRenderLeaf(mainMatchPath, {}) // Create the initial render node leaf
  if (!mainResult) return [false]                        // Return nothing if not even a fallback exists

  const [mainRenderLeaf, mainRouteNode] = mainResult
  const slotMatchPaths = getSlotMatchPaths(mainMatchPath) // Create a map of route node ot match path
  const renderTree = createMainRenderNodeChain(mainRenderLeaf, mainRouteNode, url, slotMatchPaths) // Create main render chain
  return [mainRenderLeaf.moduleType === 'page', renderTree]
}
