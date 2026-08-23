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

type RenderSubtrees = Record<string, RenderNode> // contains SlotRenderNode
export type RenderNode = RenderLeaf | {
  routePath: string
  layout?: string
  loading?: string
  error?: string
  slots: RenderSubtrees
}

function createRenderLeaf(matchNode: MatchNode, mainParamTable: ParamTable): [RenderLeaf, RouteNode] | undefined {
  const acceptingNode = matchNode.acceptingNode
  const routeNode = acceptingNode ?? findDefaultRouteNodeParent(matchNode.searchNode.anchor)
  if (!routeNode) return

  const paramTable = { ...mainParamTable, ...getParamTable(matchNode) }
  if (matchNode.catchallCapture) {  // implies acceptingNode exists
    const catchallName = acceptingNode!.segment.value // safe because catchallCapture implies acceptingNode exists
    paramTable[catchallName] = matchNode.catchallCapture
  }
  const moduleType = acceptingNode ? 'page' : 'default'
  const modulePath = routeNode.modulePaths[moduleType]!
  const routePath = getRoutePath(routeNode)
  const renderLeaf: RenderLeaf = { moduleType, modulePath, routePath, paramTable }
  return [renderLeaf, routeNode]
}

function wrapRenderNode(routeNode: RouteNode, childRenderNode: RenderNode, slotRenderNodes?: RenderSubtrees): RenderNode {
  const { layout, loading, error } = routeNode.modulePaths
  if (!layout && !loading && !error && !slotRenderNodes)
    return childRenderNode

  const routePath = getRoutePath(routeNode)
  const slots = slotRenderNodes ?? {} // warn users to not modify prototype chain
  slots.children = childRenderNode
  return { routePath, layout, loading, error, slots }
}

function createRenderNodeChain(renderLeaf: RenderNode, routeNode: RouteNode, slotRenderNodeMap?: Map<RouteNode, RenderSubtrees>): RenderNode {
  let renderNode = renderLeaf
  for (let node: RouteNode | undefined = routeNode; node; node = getRouteNodeParentIfNotSlot(node)) {
    const slotRenderNodes = slotRenderNodeMap?.get(node)
    renderNode = wrapRenderNode(node, renderNode, slotRenderNodes)
  }
  return renderNode
}

function createSlotRenderNodeMap(mainMatchPath: MatchNode, url: string[]): Map<RouteNode, RenderSubtrees> {
  const slotRenderNodesNap = new Map<RouteNode, RenderSubtrees>()

  for (const [routeNode, matchNode] of getSlotMatchNodes(mainMatchPath)) {
    const mainParamTable = getParamTable(matchNode)
    const slotRenderNodes: RenderSubtrees = {}

    for (const [slotName, slotSearchTree] of matchNode.searchNode.slots ?? []) {
      const slotMatchPath = createMatchPath(slotSearchTree, url)
      const context = createRenderLeaf(slotMatchPath, mainParamTable)
      if (context !== undefined)
        slotRenderNodes[slotName] = createRenderNodeChain(...context)
    }
    if (Object.keys(slotRenderNodes).length) {
      slotRenderNodesNap.set(routeNode, slotRenderNodes)
      break
    }
  }
  return slotRenderNodesNap
}

/** Returns whether the main children route matched a real page, together with
 *  the render tree. `success` is false for default fallbacks and when nothing
 *  can be rendered. */
export function createRenderTree(urlString: string, searchTree: SearchNode): [success: boolean, renderTree?: RenderNode] {
  const url = urlString.split('/')                        // Convert to url string array, url[0] is always '' (root's own position)
  const mainMatchPath = createMatchPath(searchTree, url)  // Find search node path with params that match the url
  const mainContext = createRenderLeaf(mainMatchPath, {}) // Create the initial render node leaf
  if (!mainContext) return [false]                        // Return nothing if not even a fallback exists

  const [mainRenderLeaf, mainRouteNode] = mainContext
  const slotRenderNodeMap = createSlotRenderNodeMap(mainMatchPath, url)
  const renderTree = createRenderNodeChain(mainRenderLeaf, mainRouteNode, slotRenderNodeMap)
  return [mainRenderLeaf.moduleType === 'page', renderTree]
}
