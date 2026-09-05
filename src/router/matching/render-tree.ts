import type { RouteModulePaths } from '../compiling/route-module'
import type { RouteNode } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree'
import type { MatchNode } from './match-tree'
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

/** Collects every dynamic/catchall param captured along the way to `matchNode`,
 *  walking up via `.parent`. Static positions contribute nothing. */
function getParamTable(matchNode: MatchNode): ParamTable {
  const params: ParamTable = dict()
  for (let node: MatchNode | undefined = matchNode; node; node = node.parent) {
    const position = node.position
    if (position && position.type !== 'static') {
      const paramName = node.searchNode.anchor.segment.value
      params[paramName] = position.url
    }
  }
  return params
}

function createRenderLeaf(matchNode: MatchNode, mainParams: ParamTable): RenderNode {
  const contentNode = matchNode.page ?? matchNode.searchNode.default
  const moduleType = matchNode.page ? 'page' : 'default'
  const params: ParamTable = Object.assign(dict(), mainParams, getParamTable(matchNode))
  const path = contentNode.modulePaths[moduleType]!
  return { slots: dict(), content: { path, params } }
}

function wrapRenderNode(childRenderNode: RenderNode, modulePaths: RouteModulePaths, slots?: SlotRenderNodes): RenderNode {
  const { layout, loading, error, default: def } = modulePaths
  if (!layout && !loading && !error && !def && !slots)  // don't wrap if nothing to wrap
    return childRenderNode

  slots ??= dict()
  slots.children = childRenderNode
  return { layout, loading, error, default: def, slots }
}

function createSlotRenderNode(matchNode: MatchNode, mainParams: ParamTable): RenderNode {
  const renderLeaf = createRenderLeaf(matchNode, mainParams)
  const contentNode = matchNode.page ?? matchNode.searchNode.default
  let renderNode: RenderNode = renderLeaf

  for (let node: RouteNode | undefined = contentNode; node; node = getNonSlotParent(node))
    renderNode = wrapRenderNode(renderNode, node.modulePaths)
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

function createMainRenderNode(matchNode: MatchNode): RenderNode {
  const renderLeaf = createRenderLeaf(matchNode, {})
  const contentNode = matchNode.page ?? matchNode.searchNode.default
  let childRenderNode = renderLeaf  // child since traversal is bottom up
  let childMatchNode: MatchNode | undefined = matchNode

  for (let routeNode: RouteNode | undefined = contentNode; routeNode; routeNode = getNonSlotParent(routeNode)) {
    if (childMatchNode?.searchNode.anchor !== routeNode)
      childRenderNode = wrapRenderNode(childRenderNode, routeNode.modulePaths)
    else {
      const slots = createSlotRenderNodes(childMatchNode) // TODO: disallow @children slot name
      childRenderNode = wrapRenderNode(childRenderNode, routeNode.modulePaths, slots)
      childMatchNode = childMatchNode.parent  // update matchNode if an anchor is found
    }
  }
  return childRenderNode // at this point it becomes the root render node
}

/** Creates the render tree for a URL - never undefined, since the root's
 *  guaranteed default ensures the main path always resolves to something. */
export function createRenderTree(url: string[], searchTree: SearchNode): RenderNode {
  const matchNode = createMatchTree(searchTree, url)
  return createMainRenderNode(matchNode)
}
