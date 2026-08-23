import type { RouteNode } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree'
import type { MatchNode } from './match-path'
import { getRoutePath, getRouteNodeParentIfNotSlot, findDefaultRouteNodeParent } from '../compiling/route-tree'
import { createMatchTree } from './match-path'

type ParamTable = Record<string, string | string[]> // dynamic route parameters or catchall parameters as string arrays
type RenderLeaf = {
  routePath: string
  moduleType: 'page' | 'default' // page or default
  modulePath: string
  paramTable: ParamTable
}

type SlotRenderNodes = Record<string, RenderNode> // contains SlotRenderNode
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

/** Assembles the params accumulated by walking matchNode's own chain -
 *  callers combine this with any inherited table themselves. */
function getParamTable(matchNode: MatchNode): ParamTable {
  const paramTable: ParamTable = {}
  for (let node: MatchNode | undefined = matchNode; node; node = node.parent) {
    if (!node.dynamicCapture) continue
    const dynamicNode = node.searchNode.anchor
    const paramName = dynamicNode.segment.value
    paramTable[paramName] = node.dynamicCapture
  }
  return paramTable
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

function createRenderNode(routeNode: RouteNode, matchNode: MatchNode | undefined, childRenderNode: RenderNode): RenderNode {
  const aligned = matchNode?.searchNode.anchor === routeNode
  let slots: SlotRenderNodes | undefined

  if (aligned) {
    const mainParamTable = getParamTable(matchNode!)
    const slotRenderNodes: SlotRenderNodes = {}  // NOTE: never modify prototype chain
    for (const [slotName, slotMatchNode] of matchNode!.subtrees ?? []) {
      const context = createRenderLeaf(slotMatchNode, mainParamTable)
      if (context)
        slotRenderNodes[slotName] = createRenderNode(context[1], slotMatchNode, context[0])
    }
    if (Object.keys(slotRenderNodes).length)
      slots = slotRenderNodes
  }

  const renderNode = wrapRenderNode(routeNode, childRenderNode, slots)
  const parentRouteNode = getRouteNodeParentIfNotSlot(routeNode)
  if (!parentRouteNode) return renderNode

  const parentMatchNode = aligned ? matchNode!.parent : matchNode
  return createRenderNode(parentRouteNode, parentMatchNode, renderNode)
}

/** Returns whether the main children route matched a real page, together with
 *  the render tree. `success` is false for default fallbacks and when nothing
 *  can be rendered. */
export function createRenderTree(urlString: string, searchTree: SearchNode): [success: boolean, renderTree?: RenderNode] {
  const url = urlString.split('/') // Convert to url string array, url[0] is always '' (root's own position)
  const mainMatchNode = createMatchTree(searchTree, url) // Find search node path with params that match the url, slots resolved eagerly
  const mainContext = createRenderLeaf(mainMatchNode, {}) // Create the initial render node leaf
  if (!mainContext) return [false] // Return nothing if not even a fallback exists

  const [mainRenderLeaf, mainRouteNode] = mainContext
  const renderTree = createRenderNode(mainRouteNode, mainMatchNode, mainRenderLeaf)
  return [mainRenderLeaf.moduleType === 'page', renderTree]
}
