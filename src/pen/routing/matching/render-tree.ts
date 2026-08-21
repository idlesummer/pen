import type { RouteNode } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree'
import type { ParamTable, MatchNode } from './match-path'
import { getRoutePath, getRouteNodeParentIfNotSlot, findDefaultRouteNodeParent } from '../compiling/route-tree'
import { createMatchPath, getParamTable, getSlotMatchNodes } from './match-path'

type RenderLeaf = {
  routePath: string
  moduleType: 'page' | 'default' // page or default
  modulePath: string
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

function createRenderLeaf(matchNode: MatchNode, mainParamTable: ParamTable): [RenderLeaf, RouteNode] | undefined {
  const acceptingNode = matchNode.acceptingNode
  const routeNode = acceptingNode ?? findDefaultRouteNodeParent(matchNode.searchNode.anchor)
  if (!routeNode) return

  const paramTable = { ...mainParamTable, ...getParamTable(matchNode) }
  if (matchNode.catchallCapture) {
    const catchallName = acceptingNode!.segment.value
    paramTable[catchallName] = matchNode.catchallCapture
  }
  const moduleType = acceptingNode ? 'page' : 'default'
  const modulePath = routeNode.modulePaths[moduleType]!
  const routePath = getRoutePath(routeNode)
  const renderLeaf: RenderLeaf = { moduleType, modulePath, routePath, paramTable }
  return [renderLeaf, routeNode]
}

function wrapRenderNode(routeNode: RouteNode, childRenderNode: RenderNode, slotRenderNodes?: SlotRenderNodes): RenderNode {
  const { layout, loading, error } = routeNode.modulePaths
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

function createSlotRenderNodes(matchNode: MatchNode, url: string[]): SlotRenderNodes | undefined {
  const searchNode = matchNode.searchNode
  const mainParamTable = getParamTable(matchNode)
  const slotRenderNodes: SlotRenderNodes = {}  // NOTE: never modity prototype chain

  for (const [slotName, slotSearchTree] of searchNode.slots ?? []) {
    const slotMatchPath = createMatchPath(slotSearchTree, url)
    const context = createRenderLeaf(slotMatchPath, mainParamTable)
    if (context !== undefined)
      slotRenderNodes[slotName] = createRenderNodeChain(...context)
  }
  for (const _ in slotRenderNodes)  // a bit more efficent than Object.keys(...).length
    return slotRenderNodes
}

function createMainRenderNodeChain(mainRenderLeaf: RenderNode, routeNode: RouteNode, url: string[], slotMatchNodes: Map<RouteNode, MatchNode>): RenderNode {
  let renderNode = mainRenderLeaf
  for (let node: RouteNode | undefined = routeNode; node; node = node.parent) { // Walk each RouteNode from the RenderLeaf toward the root
    const slotMatchNode = slotMatchNodes.get(node)
    const slots = slotMatchNode && createSlotRenderNodes(slotMatchNode, url)
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
  const mainContext = createRenderLeaf(mainMatchPath, {}) // Create the initial render node leaf
  if (!mainContext) return [false]                        // Return nothing if not even a fallback exists

  const [mainRenderLeaf, mainRouteNode] = mainContext
  const slotMatchNodes = getSlotMatchNodes(mainMatchPath) // Create a map of route node to match node
  const renderTree = createMainRenderNodeChain(mainRenderLeaf, mainRouteNode, url, slotMatchNodes) // Create main render chain
  return [mainRenderLeaf.moduleType === 'page', renderTree]
}
