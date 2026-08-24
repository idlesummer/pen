import type { RouteNode } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree'
import type { MatchNode } from './match-path'
import { getRoutePath, getNonSlotParent, findDefaultRouteNodeParent } from '../compiling/route-tree'
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
    if (!node.dynamicCapture) continue

    const dynamicNode = node.searchNode.anchor
    const paramName = dynamicNode.segment.value
    params[paramName] = node.dynamicCapture
  }
  return params
}

/** Returns the leaf's own render content together with the RouteNode it
 *  anchors to - the RouteNode is only for the caller to climb from, and
 *  never touches the RenderLeaf/RenderNode types themselves. */
function createRenderContent(matchNode: MatchNode, mainParamTable: ParamTable): [RenderLeaf, RouteNode] | undefined {
  const acceptingNode = matchNode.acceptingNode
  const routeNode = acceptingNode ?? findDefaultRouteNodeParent(matchNode.searchNode.anchor)
  if (!routeNode) return

  const params = { ...mainParamTable, ...getParamTable(matchNode) }
  if (matchNode.catchallCapture) {  // implies acceptingNode exists
    const catchallName = acceptingNode!.segment.value // safe because catchallCapture implies acceptingNode exists
    params[catchallName] = matchNode.catchallCapture
  }
  const moduleType = acceptingNode ? 'page' : 'default'
  const modulePath = routeNode.modulePaths[moduleType]!
  const routePath = getRoutePath(routeNode)
  return [{ moduleType, modulePath, routePath, params }, routeNode]
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

/** Builds a slot's own render node: its leaf content, then climbs to its
 *  slot boundary. No recursive call for further slots - a slot's own chain
 *  can never itself contain slots (sanitizeRouteTree prunes nested slots
 *  at compile time), so there's nothing further to check for here. */
function createSlotRenderNode(matchNode: MatchNode, inheritedParams: ParamTable): RenderNode | undefined {
  const content = createRenderContent(matchNode, inheritedParams)
  if (!content) return

  const [renderLeaf, leafRouteNode] = content
  let renderNode: RenderNode = renderLeaf
  for (let node: RouteNode | undefined = leafRouteNode; node; node = getNonSlotParent(node))
    renderNode = wrapRenderNode(node, renderNode)
  return renderNode
}

/** Builds matchNode's own render node: its leaf content, then climbs from
 *  the accepting RouteNode toward root, re-checking for slots at every step -
 *  matchNode advances in lockstep with routeNode, only when aligned - since
 *  createMatchTree resolves .subtrees on every node along the winning chain,
 *  not just the leaf. */
function createRenderNode(matchNode: MatchNode, inheritedParams: ParamTable): RenderNode | undefined {
  const content = createRenderContent(matchNode, inheritedParams)
  if (!content) return

  const [leaf, leafRouteNode] = content
  let renderNode: RenderNode = leaf
  let currentRouteNode: RouteNode | undefined = leafRouteNode
  let currentMatchNode: MatchNode | undefined = matchNode

  while (currentRouteNode) {
    const aligned: boolean = currentMatchNode?.searchNode.anchor === currentRouteNode
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

/** Returns whether the main children route matched a real page, together with
 *  the render tree. `success` is false for default fallbacks and when nothing
 *  can be rendered. Takes an already-normalized url segment array (see
 *  normalizeUrl) - url[0] is always '' (root's own position). */
export function createRenderTree(url: string[], searchTree: SearchNode): [success: boolean, renderTree?: RenderNode] {
  const mainMatchNode = createMatchTree(searchTree, url) // Find search node path with params that match the url, slots resolved eagerly
  const renderTree = createRenderNode(mainMatchNode, {})
  if (!renderTree) return [false] // Return nothing if not even a fallback exists

  return [!!mainMatchNode.acceptingNode, renderTree]
}
