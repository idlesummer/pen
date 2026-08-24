import type { RouteNode } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree'
import type { MatchNode } from './match-path'
import { getRoutePath, getNonSlotParent } from '../compiling/route-tree'
import { createMatchTree } from './match-path'

type ParamTable = Record<string, string | string[]> // dynamic route parameters or catchall parameters as string arrays
type RenderLeaf = {
  routePath: string
  moduleType: 'page' | 'default' // page or default
  modulePath: string
  params: ParamTable
}

type SlotRenderNodes = Record<string, RenderNode> // contains SlotRenderNode
export type RenderNode = RenderLeaf | {
  routePath: string
  layout?: string
  loading?: string
  error?: string
  slots: SlotRenderNodes
}

function getParamTable(matchNode: MatchNode): ParamTable {
  const params: ParamTable = {}
  for (let node: MatchNode | undefined = matchNode; node; node = node.parent) {
    if (!node.dynamicParam) continue

    const dynamicNode = node.searchNode.anchor
    const paramName = dynamicNode.segment.value
    params[paramName] = node.dynamicParam
  }
  return params
}

function createRenderLeaf(matchNode: MatchNode, mainParamTable: ParamTable): [RenderLeaf, RouteNode] | undefined {
  if (!matchNode.leafContent) return  // return early if no page or default exists
  const [contentType, contentNode, catchallParams] = matchNode.leafContent

  const params = { ...mainParamTable, ...getParamTable(matchNode) }
  if (catchallParams) {
    const catchallName = contentNode.segment.value
    params[catchallName] = catchallParams
  }
  const modulePath = contentNode.modulePaths[contentType]!
  const routePath = getRoutePath(contentNode)
  const renderLeaf: RenderLeaf = { moduleType: contentType, modulePath, routePath, params }
  return [renderLeaf, contentNode]
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

function createSlotRenderNode(matchNode: MatchNode, inheritedParams: ParamTable): RenderNode | undefined {
  const content = createRenderLeaf(matchNode, inheritedParams)
  if (!content) return

  const [renderLeaf, leafRouteNode] = content
  let renderNode: RenderNode = renderLeaf
  for (let node: RouteNode | undefined = leafRouteNode; node; node = getNonSlotParent(node))
    renderNode = wrapRenderNode(node, renderNode)
  return renderNode
}

function createMainRenderNode(mainMatchNode: MatchNode, inheritedParams: ParamTable): RenderNode | undefined {
  const content = createRenderLeaf(mainMatchNode, inheritedParams)
  if (!content) return

  const [leaf, leafRouteNode] = content
  let renderNode: RenderNode = leaf
  let currentRouteNode: RouteNode | undefined = leafRouteNode
  let currentMatchNode: MatchNode | undefined = mainMatchNode

  while (currentRouteNode) {
    const searchNode: SearchNode | undefined = currentMatchNode?.searchNode
    const aligned: boolean = searchNode?.anchor === currentRouteNode
    let slots: SlotRenderNodes | undefined

    if (aligned) {
      const mainParamTable = getParamTable(currentMatchNode!)
      const slotRenderNodes: SlotRenderNodes = {}  // NOTE: never modify prototype chain
      for (const [slotName, slotMatchNode] of currentMatchNode!.subtrees ?? []) {
        const slotRenderNode = createSlotRenderNode(slotMatchNode, mainParamTable)
        if (slotRenderNode) slotRenderNodes[slotName] = slotRenderNode
      }
      if (Object.keys(slotRenderNodes).length)
        slots = slotRenderNodes
    }
    renderNode = wrapRenderNode(currentRouteNode, renderNode, slots)
    const parentRouteNode = getNonSlotParent(currentRouteNode)
    currentMatchNode = aligned ? currentMatchNode?.parent : currentMatchNode
    currentRouteNode = parentRouteNode
  }
  return renderNode
}

export function createRenderTree(url: string[], searchTree: SearchNode): [success: boolean, renderTree?: RenderNode] {
  const mainMatchNode = createMatchTree(searchTree, url) // Find search node path with params that match the url, slots resolved eagerly
  const renderTree = createMainRenderNode(mainMatchNode, {})
  return renderTree ? [mainMatchNode.leafContent?.[0] === 'page', renderTree] : [false] // Return nothing if not even a fallback exists
}
