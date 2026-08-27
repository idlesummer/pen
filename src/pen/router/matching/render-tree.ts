import type { RouteNode } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree'
import type { MatchLeaf, MatchNode } from './match-tree'
import { getNonSlotParent } from '../compiling/route-tree'
import { createMatchTree } from './match-tree'

type ParamTable = Record<string, string | string[]> // dynamic route parameters or catchall parameters as string arrays
type RenderLeaf = {
  contentType: 'page' | 'default' // page or default
  contentPath: string
  params: ParamTable
}

type SlotRenderNodes = Record<string, RenderNode>
export type RenderNode = RenderLeaf | {
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

function createRenderLeaf(matchNode: MatchNode, matchLeaf: MatchLeaf, mainParams: ParamTable): RenderLeaf {
  const { contentType, contentNode, catchallParams } = matchLeaf
  const params = { ...mainParams, ...getParamTable(matchNode) }

  if (catchallParams) {
    const catchallName = contentNode .segment.value
    params[catchallName] = catchallParams
  }
  const contentPath = contentNode.modulePaths[contentType]!
  return { contentType, contentPath, params }
}

function wrapRenderNode(renderNode: RenderNode, routeNode: RouteNode, slots?: SlotRenderNodes): RenderNode {
  const { layout, loading, error } = routeNode.modulePaths
  if (!layout && !loading && !error && !slots)
    return renderNode

  ;(slots ??= {}).children = renderNode
  return { layout, loading, error, slots }
}

function createSlotRenderNode(matchNode: MatchNode, mainParams: ParamTable): RenderNode | undefined {
  if (!matchNode.leaf) return
  const renderLeaf = createRenderLeaf(matchNode, matchNode.leaf, mainParams)
  const contentNode = matchNode.leaf.contentNode
  let renderNode: RenderNode = renderLeaf

  for (let node: RouteNode | undefined = contentNode; node; node = getNonSlotParent(node))
    renderNode = wrapRenderNode(renderNode, node)
  return renderNode
}

function createSlotRenderNodes(matchNode: MatchNode): SlotRenderNodes | undefined {
  if (!matchNode.subtrees) return
  const params = getParamTable(matchNode)
  let slots: SlotRenderNodes | undefined

  for (const [subtreeName, subtree] of matchNode.subtrees) {
    const slotNode = createSlotRenderNode(subtree, params)
    if (slotNode) (slots ??= {})[subtreeName] = slotNode
  }
  return slots
}

function createMainRenderNode(mainMatchNode: MatchNode): RenderNode | undefined {
  if (!mainMatchNode.leaf) return
  const renderLeaf = createRenderLeaf(mainMatchNode, mainMatchNode.leaf, {})
  const contentNode = mainMatchNode.leaf.contentNode
  let renderNode: RenderNode = renderLeaf
  let matchNode: MatchNode | undefined = mainMatchNode

  for (let node: RouteNode | undefined = contentNode; node; node = getNonSlotParent(node)) {
    if (matchNode?.searchNode.anchor !== node)
      renderNode = wrapRenderNode(renderNode, node)
    else {
      const slots = createSlotRenderNodes(matchNode)
      renderNode = wrapRenderNode(renderNode, node, slots)
      matchNode = matchNode.parent  // update matchNode if an anchor is found
    }
  }
  return renderNode
}

/** Creates the render tree for a URL and reports whether it matched a page. */
export function createRenderTree(url: string[], searchTree: SearchNode): [success: boolean, renderTree?: RenderNode] {
  const mainMatchNode = createMatchTree(searchTree, url)
  const renderTree = createMainRenderNode(mainMatchNode)
  return [mainMatchNode.leaf?.contentType === 'page', renderTree]
}
