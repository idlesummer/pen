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

type SlotRenderNodes = Record<string, RenderNode>
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

function createRenderLeaf(matchNode: MatchNode, mainParamTable: ParamTable): RenderLeaf | undefined {
  if (!matchNode.leaf) return  // return early if no page or default exists
  const { contentType, contentNode  , catchallParams } = matchNode.leaf
  const params = { ...mainParamTable, ...getParamTable(matchNode) }

  if (catchallParams) {
    const catchallName = contentNode .segment.value
    params[catchallName] = catchallParams
  }
  const modulePath = contentNode .modulePaths[contentType]!
  const routePath = contentNode .path
  return { moduleType: contentType, modulePath, routePath, params }
}

function wrapRenderNode(renderNode: RenderNode, routeNode: RouteNode, slots?: SlotRenderNodes): RenderNode {
  const { layout, loading, error } = routeNode.modulePaths
  if (!layout && !loading && !error && !slots)
    return renderNode

  const routePath = routeNode.path;
  (slots ??= {}).children = renderNode
  return { routePath, layout, loading, error, slots }
}

function createSlotRenderNode(matchNode: MatchNode, mainParams: ParamTable): RenderNode | undefined {
  const renderLeaf = createRenderLeaf(matchNode, mainParams)
  if (!renderLeaf) return

  const contentNode  = matchNode.leaf!.contentNode
  let renderNode: RenderNode = renderLeaf
  for (let node: RouteNode | undefined = contentNode  ; node; node = getNonSlotParent(node))
    renderNode = wrapRenderNode(renderNode, node)
  return renderNode
}

function createSlotRenderNodes(matchNode: MatchNode): SlotRenderNodes | undefined {
  if (!matchNode.subtrees) return
  const params = getParamTable(matchNode)
  let slots: SlotRenderNodes | undefined

  for (const [subtreeName, subtree] of matchNode.subtrees) {
    const slotNode = createSlotRenderNode(subtree, params)
    if (slotNode)
      (slots ??= {})[subtreeName] = slotNode
  }
  return slots
}

function createMainRenderNode(mainMatchNode: MatchNode): RenderNode | undefined {
  const renderLeaf = createRenderLeaf(mainMatchNode, {})
  if (!renderLeaf) return

  const contentNode  = mainMatchNode.leaf!.contentNode
  let renderNode: RenderNode = renderLeaf
  let matchNode: MatchNode | undefined = mainMatchNode

  for (let node: RouteNode | undefined = contentNode  ; node; node = getNonSlotParent(node)) {
    const isMatchNodeAnchor = matchNode?.searchNode.anchor === node
    const slots = isMatchNodeAnchor ? createSlotRenderNodes(matchNode!) : undefined
    renderNode = wrapRenderNode(renderNode, node, slots)

    if (isMatchNodeAnchor)
      matchNode = matchNode?.parent
  }
  return renderNode
}

export function createRenderTree(url: string[], searchTree: SearchNode): [success: boolean, renderTree?: RenderNode] {
  const mainMatchNode = createMatchTree(searchTree, url)
  const renderTree = createMainRenderNode(mainMatchNode)
  return [mainMatchNode.leaf?.contentType === 'page', renderTree]
}
