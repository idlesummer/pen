import type { RouteNode } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree'
import type { MatchNode } from './match-tree'
import { getNonSlotParent } from '../compiling/route-tree'
import { createMatchTree } from './match-tree'

type ParamTable = Record<string, string | string[]> // dynamic route parameters or catchall parameters as string arrays
type RenderLeaf = {
  routePath: string
  moduleType: 'page' | 'default' // page or default
  modulePath: string
  params: ParamTable
}

type RenderSubtrees = Record<string, RenderNode>
export type RenderNode = RenderLeaf | {
  routePath: string
  layout?: string
  loading?: string
  error?: string
  subtrees: RenderSubtrees
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
  const routePath = contentNode.path
  const renderLeaf: RenderLeaf = { moduleType: contentType, modulePath, routePath, params }
  return [renderLeaf, contentNode]
}

function wrapRenderNode(routeNode: RouteNode, childRenderNode: RenderNode, subtreeRenderNodes?: RenderSubtrees): RenderNode {
  const { layout, loading, error } = routeNode.modulePaths
  if (!layout && !loading && !error && !subtreeRenderNodes)
    return childRenderNode

  const routePath = routeNode.path
  const subtrees = subtreeRenderNodes ?? {} // warn users to not modify prototype chain
  subtrees.children = childRenderNode
  return { routePath, layout, loading, error, subtrees }
}

function createRenderSubtree(matchNode: MatchNode, mainParamTable: ParamTable): RenderNode | undefined {
  const content = createRenderLeaf(matchNode, mainParamTable)
  if (!content) return

  const [renderLeaf, leafRouteNode] = content
  let renderNode: RenderNode = renderLeaf
  for (let node: RouteNode | undefined = leafRouteNode; node; node = getNonSlotParent(node))
    renderNode = wrapRenderNode(node, renderNode)
  return renderNode
}

function createMainRenderNode(mainMatchNode: MatchNode): RenderNode | undefined {
  const content = createRenderLeaf(mainMatchNode, {})
  if (!content) return

  const [leaf, leafRouteNode] = content
  let renderNode: RenderNode = leaf
  let currentRouteNode: RouteNode | undefined = leafRouteNode
  let currentMatchNode: MatchNode | undefined = mainMatchNode

  while (currentRouteNode) {
    const searchNode: SearchNode | undefined = currentMatchNode?.searchNode
    const aligned: boolean = searchNode?.anchor === currentRouteNode
    let subtrees: RenderSubtrees | undefined

    if (aligned) {
      const mainParamTable = getParamTable(currentMatchNode!)
      const subtreeRenderNodes: RenderSubtrees = {}
      for (const [slotName, slotMatchNode] of currentMatchNode!.subtrees ?? []) {
        const subtreeRenderNode = createRenderSubtree(slotMatchNode, mainParamTable)
        if (subtreeRenderNode)
          subtreeRenderNodes[slotName] = subtreeRenderNode
      }
      if (Object.keys(subtreeRenderNodes).length)
        subtrees = subtreeRenderNodes
    }
    renderNode = wrapRenderNode(currentRouteNode, renderNode, subtrees)
    const parentRouteNode = getNonSlotParent(currentRouteNode)
    currentMatchNode = aligned ? currentMatchNode?.parent : currentMatchNode
    currentRouteNode = parentRouteNode
  }
  return renderNode
}

export function createRenderTree(url: string[], searchTree: SearchNode): [success: boolean, renderTree?: RenderNode] {
  const mainMatchNode = createMatchTree(searchTree, url)
  const renderTree = createMainRenderNode(mainMatchNode)
  return [mainMatchNode.leafContent?.[0] === 'page', renderTree]
}
