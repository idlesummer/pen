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

function wrapRenderNode(renderNode: RenderNode, routeNode: RouteNode, slots?: SlotRenderNodes): RenderNode {
  const { layout, loading, error } = routeNode.modulePaths
  if (!layout && !loading && !error && !slots)
    return renderNode

  const routePath = routeNode.path;
  (slots ??= {}).children = renderNode
  return { routePath, layout, loading, error, slots }
}

/** Walks routeNode's ancestors, wrapping as it goes. getSlotsAt (when given) is asked,
 *  at each node, whether slots should attach there - the one piece that differs
 *  between the main path (has slots) and a slot's own path (never does, by construction). */
function wrapAlongRoute(leaf: RenderNode, fromRouteNode: RouteNode, getSlotsAt?: (routeNode: RouteNode) => SlotRenderNodes | undefined): RenderNode {
  let renderNode = leaf
  for (let node: RouteNode | undefined = fromRouteNode; node; node = getNonSlotParent(node))
    renderNode = wrapRenderNode(renderNode, node, getSlotsAt?.(node))
  return renderNode
}

function createSlotRenderNode(matchNode: MatchNode, mainParams: ParamTable): RenderNode | undefined {
  const content = createRenderLeaf(matchNode, mainParams)
  if (!content) return

  const [renderLeaf, contentNode] = content
  return wrapAlongRoute(renderLeaf, contentNode) // slot subtrees are terminal - no nested slots to look up
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
  const content = createRenderLeaf(mainMatchNode, {})
  if (!content) return

  const [renderLeaf, contentNode] = content
  let matchNode: MatchNode | undefined = mainMatchNode

  return wrapAlongRoute(renderLeaf, contentNode, (node) => {
    const isMatchNodeAnchor = matchNode?.searchNode.anchor === node
    const slots = isMatchNodeAnchor ? createSlotRenderNodes(matchNode!) : undefined
    if (isMatchNodeAnchor)
      matchNode = matchNode?.parent
    return slots
  })
}

export function createRenderTree(url: string[], searchTree: SearchNode): [success: boolean, renderTree?: RenderNode] {
  const mainMatchNode = createMatchTree(searchTree, url)
  const renderTree = createMainRenderNode(mainMatchNode)
  return [mainMatchNode.leafContent?.[0] === 'page', renderTree]
}
