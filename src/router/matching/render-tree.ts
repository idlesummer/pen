import type { RouteModulePaths } from '../compiling/route-module'
import type { RouteNode } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree'
import type { MatchNode } from './match-tree'
import { forEachAncestor } from '../compiling/route-tree'
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
  content?: string
  params?: ParamTable // present on leaves always, and on wrappers only when they own a layout module
}

function getContentNode(matchNode: MatchNode): RouteNode {
  return matchNode.page ?? matchNode.searchNode.default
}

function getParamTable(matchNode: MatchNode): ParamTable {
  const params: ParamTable = dict()
  for (let node: MatchNode | undefined = matchNode; node; node = node.parent) {
    const position = node.position
    if (!position || position.type === 'static') continue // if root or static, skip
    const paramName = node.searchNode.anchor.segment.value
    params[paramName] = position.url
  }
  return params
}

function createRenderLeaf(matchNode: MatchNode, mainParams: ParamTable): RenderNode {
  const contentNode = getContentNode(matchNode)
  const moduleType = matchNode.page ? 'page' : 'default'
  const params: ParamTable = Object.assign(dict(), mainParams, getParamTable(matchNode))
  const content = contentNode.modulePaths[moduleType]!
  return { slots: dict(), content, params }
}

function wrapRenderNode(childRenderNode: RenderNode, modulePaths: RouteModulePaths, params?: ParamTable, slots?: SlotRenderNodes): RenderNode {
  const { layout, loading, error, default: def } = modulePaths
  if (!layout && !loading && !error && !def && !slots)  // don't wrap if nothing to wrap
    return childRenderNode

  slots ??= dict()
  slots.children = childRenderNode
  return { layout, loading, error, default: def, slots, params: layout ? params : undefined }
}

/** Walks routeNode's ancestors, wrapping childRenderNode at each one. Params
 *  are recomputed at every step from the nearest at-or-below match position
 *  (childMatchNode) - not just at anchors - since a group between two
 *  anchors owns no match position of its own but still inherits whatever
 *  the nearer anchor already captured. Slots only ever attach at anchors,
 *  since only an anchor's SearchNode can carry a `.slots` map. */
function wrapAncestors(matchNode: MatchNode, contentNode: RouteNode, childRenderNode: RenderNode, includeSlots: boolean): RenderNode {
  let childMatchNode: MatchNode | undefined = matchNode

  forEachAncestor(contentNode, (routeNode) => {
    // childMatchNode is guaranteed defined here: the route tree's own root always
    // gets a SearchNode (see createSearchTree), so the anchor chain never runs
    // out before the route-node walk does.
    const params = routeNode.modulePaths.layout ? getParamTable(childMatchNode!) : undefined
    let slots: SlotRenderNodes | undefined

    if (childMatchNode?.searchNode.anchor === routeNode) {
      slots = includeSlots ? createSlotRenderNodes(childMatchNode) : undefined // TODO: disallow @children slot name
      childMatchNode = childMatchNode.parent
    }
    childRenderNode = wrapRenderNode(childRenderNode, routeNode.modulePaths, params, slots)
  })
  return childRenderNode
}

function createSlotRenderNode(matchNode: MatchNode, mainParams: ParamTable): RenderNode {
  const renderLeaf = createRenderLeaf(matchNode, mainParams)
  return wrapAncestors(matchNode, getContentNode(matchNode), renderLeaf, false)
}

function createSlotRenderNodes(matchNode: MatchNode): SlotRenderNodes | undefined {
  if (!matchNode.subtrees) return
  const params = getParamTable(matchNode)
  const slots = dict<RenderNode>()

  for (const [subtreeName, matchPath] of Object.entries(matchNode.subtrees))
    slots[subtreeName] = createSlotRenderNode(matchPath, params)
  return slots
}

function createMainRenderNode(matchNode: MatchNode): RenderNode {
  const renderLeaf = createRenderLeaf(matchNode, {})
  return wrapAncestors(matchNode, getContentNode(matchNode), renderLeaf, true)
}

/** Creates the render tree for a URL - never undefined, since the root's
 *  guaranteed default ensures the main path always resolves to something. */
export function createRenderTree(url: string[], searchTree: SearchNode): RenderNode {
  const matchNode = createMatchTree(searchTree, url)
  return createMainRenderNode(matchNode)
}
