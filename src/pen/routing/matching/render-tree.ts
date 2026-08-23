import type { RouteNode } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree'
import type { MatchNode } from './match-path'
import { getRoutePath, getRouteNodeParentIfNotSlot, findDefaultRouteNodeParent } from '../compiling/route-tree'
import { createMatchTree } from './match-path'

type ParamTable = Record<string, string | string[]> // dynamic route parameters or catchall parameters as string arrays
type RenderLeaf = {
  routePath: string
  moduleType: 'page' | 'default' // page or default
  modulePath: string
  paramTable: ParamTable
}

type SlotRenderNodes = Record<string, RenderNode> // contains SlotRenderNode
export type RenderNode = RenderLeaf | {
  routePath: string
  layout?: string
  loading?: string
  error?: string
  slots: SlotRenderNodes
}

/** Assembles the params by walking matchNode's own chain. */
function getParamTable(matchNode: MatchNode): ParamTable {
  const paramTable: ParamTable = {}
  for (let node: MatchNode | undefined = matchNode; node; node = node.parent) {
    if (!node.dynamicCapture) continue

    const dynamicNode = node.searchNode.anchor
    const paramName = dynamicNode.segment.value
    paramTable[paramName] = node.dynamicCapture
  }
  return paramTable
}

function createRenderLeaf(matchNode: MatchNode, mainParamTable: ParamTable): [RenderLeaf, RouteNode] | undefined {
  const acceptingNode = matchNode.acceptingNode
  const routeNode = acceptingNode ?? findDefaultRouteNodeParent(matchNode.searchNode.anchor)
  if (!routeNode) return

  const paramTable = { ...mainParamTable, ...getParamTable(matchNode) }
  if (matchNode.catchallCapture) {  // implies acceptingNode exists
    const catchallName = acceptingNode!.segment.value // safe because catchallCapture implies acceptingNode exists
    paramTable[catchallName] = matchNode.catchallCapture
  }
  const moduleType = acceptingNode ? 'page' : 'default'
  const modulePath = routeNode.modulePaths[moduleType]!
  const routePath = getRoutePath(routeNode)
  const renderLeaf: RenderLeaf = { moduleType, modulePath, routePath, paramTable }
  return [renderLeaf, routeNode]
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
  let currentRouteNode: RouteNode | undefined = routeNode
  while (currentRouteNode) {
    renderNode = wrapRenderNode(currentRouteNode, renderNode)
    currentRouteNode = getRouteNodeParentIfNotSlot(currentRouteNode)
  }
  return renderNode
}

function createRenderNode(routeNode: RouteNode, matchNode: MatchNode | undefined, childRenderNode: RenderNode): RenderNode {
  let renderNode = childRenderNode
  let currentRouteNode: RouteNode | undefined = routeNode
  let currentMatchNode = matchNode

  while (currentRouteNode) {
    const aligned = currentMatchNode?.searchNode.anchor === currentRouteNode
    let slots: SlotRenderNodes | undefined

    if (aligned) {
      const mainParamTable = getParamTable(currentMatchNode!)
      const slotRenderNodes: SlotRenderNodes = {}  // NOTE: never modify prototype chain
      for (const [slotName, slotMatchNode] of currentMatchNode!.subtrees ?? []) {
        const context = createRenderLeaf(slotMatchNode, mainParamTable)
        if (context)
          slotRenderNodes[slotName] = climbToSlotBoundary(context[1], context[0])
      }
      if (Object.keys(slotRenderNodes).length)
        slots = slotRenderNodes
    }

    renderNode = wrapRenderNode(currentRouteNode, renderNode, slots)
    const parentRouteNode = getRouteNodeParentIfNotSlot(currentRouteNode)
    currentMatchNode = aligned ? currentMatchNode?.parent : currentMatchNode
    currentRouteNode = parentRouteNode
  }
  return renderNode
}

/** Returns whether the main children route matched a real page, together with
 *  the render tree. `success` is false for default fallbacks and when nothing
 *  can be rendered. */
export function createRenderTree(urlString: string, searchTree: SearchNode): [success: boolean, renderTree?: RenderNode] {
  const url = urlString.split('/') // Convert to url string array, url[0] is always '' (root's own position)
  const mainMatchTree = createMatchTree(searchTree, url) // Find search node path with params that match the url, slots resolved eagerly
  const mainContext = createRenderLeaf(mainMatchTree , {}) // Create the initial render node leaf
  if (!mainContext) return [false] // Return nothing if not even a fallback exists

  const [mainRenderLeaf, mainRouteNode] = mainContext
  const renderTree = createRenderNode(mainRouteNode, mainMatchTree, mainRenderLeaf)
  return [mainRenderLeaf.moduleType === 'page', renderTree]
}
