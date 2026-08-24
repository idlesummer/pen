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
  routeNode?: RouteNode // seeds the climb in createRenderNode/climbToSlotBoundary; set back to undefined once read, so the returned tree stays JSON.stringify-safe (RouteNode is circular via .parent/.children)
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

function createRenderLeaf(matchNode: MatchNode, mainParamTable: ParamTable): RenderLeaf | undefined {
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
  return { moduleType, modulePath, routePath, params, routeNode }
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

/** Used only for a slot's own climb: no need to check for further slots
 *  here, since a slot's chain can never itself contain slots
 *  (sanitizeRouteTree prunes nested slots at compile time). */
function climbToSlotBoundary(routeNode: RouteNode, childRenderNode: RenderNode): RenderNode {
  let renderNode = childRenderNode
  for (let node: RouteNode | undefined = routeNode; node; node = getNonSlotParent(node))
    renderNode = wrapRenderNode(node, renderNode)
  return renderNode
}

function createRenderNode(childRenderLeaf: RenderLeaf, matchNode?: MatchNode): RenderNode {
  let renderNode: RenderNode = childRenderLeaf
  let currentRouteNode: RouteNode | undefined = childRenderLeaf.routeNode
  let currentMatchNode = matchNode

  while (currentRouteNode) {
    const aligned = currentMatchNode?.searchNode.anchor === currentRouteNode
    let slots: SlotRenderNodes | undefined

    if (aligned) {
      const mainParamTable = getParamTable(currentMatchNode!)
      const slotRenderNodes: SlotRenderNodes = {}  // NOTE: never modify prototype chain
      for (const [slotName, slotMatchNode] of currentMatchNode!.subtrees ?? []) {
        const leaf = createRenderLeaf(slotMatchNode, mainParamTable)
        if (leaf) {
          slotRenderNodes[slotName] = climbToSlotBoundary(leaf.routeNode!, leaf)
          leaf.routeNode = undefined
        }
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
  const mainMatchTree = createMatchTree(searchTree, url) // Find search node path with params that match the url, slots resolved eagerly
  const mainRenderLeaf = createRenderLeaf(mainMatchTree, {}) // Create the initial render node leaf
  if (!mainRenderLeaf) return [false] // Return nothing if not even a fallback exists

  const renderTree = createRenderNode(mainRenderLeaf, mainMatchTree)
  mainRenderLeaf.routeNode = undefined
  return [mainRenderLeaf.moduleType === 'page', renderTree]
}
