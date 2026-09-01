import type { RouteNode } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree'
import type { MatchNode, MatchTree } from './match-tree'
import { getNonSlotParent } from '../compiling/route-tree'
import { dict } from '@/lib/dict'
import { createMatchTree } from './match-tree'

type ParamTable = Record<string, string | string[]> // dynamic route parameters or catchall parameters as string arrays
type SlotRenderNodes = Record<string, RenderNode>

export type RenderNode = {
  slots: SlotRenderNodes
  layout?: string
  error?: string
  loading?: string
  default?: string
  content?: {
    path: string
    params: ParamTable
  }
}

function getParamTable(matchNode: MatchNode): ParamTable {
  const params: ParamTable = dict()
  for (let node: MatchNode | undefined = matchNode; node; node = node.parent) {
    if (!node.dynamicParam) continue
    const dynamicNode = node.searchNode.anchor
    const paramName = dynamicNode.segment.value
    params[paramName] = node.dynamicParam
  }
  return params
}

function createRenderLeaf(matchTree: MatchTree, mainParams: ParamTable): RenderNode {
  const { type, node: contentNode, catchallParams } = matchTree.content
  const params: ParamTable = Object.assign(dict(), mainParams, getParamTable(matchTree))

  if (catchallParams) {
    const catchallName = contentNode.segment.value
    params[catchallName] = catchallParams
  }
  const path = contentNode.modulePaths[type]!
  return { slots: dict(), content: { path, params } }
}

function wrapRenderNode(renderNode: RenderNode, routeNode: RouteNode, slots?: SlotRenderNodes): RenderNode {
  const { layout, loading, error, default: defaultPath } = routeNode.modulePaths
  if (!layout && !loading && !error && !defaultPath && !slots)
    return renderNode

  ;(slots ??= dict()).children = renderNode
  return { layout, loading, error, default: defaultPath, slots }
}

function createSlotRenderNode(matchTree: MatchTree, mainParams: ParamTable): RenderNode {
  const renderLeaf = createRenderLeaf(matchTree, mainParams)
  const contentNode = matchTree.content.node
  let renderNode: RenderNode = renderLeaf

  for (let node: RouteNode | undefined = contentNode; node; node = getNonSlotParent(node))
    renderNode = wrapRenderNode(renderNode, node)
  return renderNode
}

function createSlotRenderNodes(matchNode: MatchNode): SlotRenderNodes | undefined {
  if (!matchNode.subtrees) return
  const params = getParamTable(matchNode)
  const slots: SlotRenderNodes = dict()

  for (const [subtreeName, subtree] of Object.entries(matchNode.subtrees))
    slots[subtreeName] = createSlotRenderNode(subtree, params)
  return slots
}

function createMainRenderNode(matchTree: MatchTree): RenderNode {
  const renderLeaf = createRenderLeaf(matchTree, {})
  const contentNode = matchTree.content.node
  let renderNode: RenderNode = renderLeaf
  let matchNode: MatchNode | undefined = matchTree

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

/** Creates the render tree for a URL - never undefined, since the root's
 *  guaranteed default ensures the main path always resolves to something. */
export function createRenderTree(url: string[], searchTree: SearchNode): RenderNode {
  const matchTree = createMatchTree(searchTree, url)
  return createMainRenderNode(matchTree)
}
