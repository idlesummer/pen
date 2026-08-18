import type { RouteNode } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree'
import type { MatchPath } from './match-path'
import type { RenderLeaf } from './render-leaf'
import { getRoutePath, getRouteNodeParentIfNotSlot } from '../compiling/route-tree'
import { createMatchPath, getMatchPathParams } from './match-path'
import { createRenderLeaf } from './render-leaf'

export type SlotRenderNodes = Record<string, RenderNode>  // Actual name is SlotRenderNode
export type RenderNode = RenderLeaf | { // Should be ShellRenderNode but inlined for brevity
  type: 'layout'
  path: string
  layout?: string
  loading?: string
  error?: string
  slots: SlotRenderNodes & { children: RenderNode }
}

function getSlotMatchPaths(matchPathLeaf: MatchPath): MatchPath[] {
  const slotMatchPaths: MatchPath[] = []
  let matchPath: MatchPath | undefined = matchPathLeaf

  for (; matchPath; matchPath = matchPath.parent) {
    if (matchPath.searchNode.slots)
      slotMatchPaths.push(matchPath)
  }
  return slotMatchPaths
}

function wrapRenderNode(routeNode: RouteNode, childRenderNode: RenderNode, extraSlots?: SlotRenderNodes): RenderNode {
  const layout = routeNode.modulePaths.get('layout')
  const loading = routeNode.modulePaths.get('loading')
  const error = routeNode.modulePaths.get('error')

  return (!layout && !loading && !error && !extraSlots) ? childRenderNode : {
    type: 'layout',
    path: getRoutePath(routeNode),
    layout, loading, error,
    slots: { ...extraSlots, children: childRenderNode },
  }
}

function createRenderNodeChain(routeNode: RouteNode, renderLeaf: RenderNode): RenderNode {
  let renderNode = renderLeaf
  let node: RouteNode | undefined = routeNode

  for (; node; node = getRouteNodeParentIfNotSlot(node))
    renderNode = wrapRenderNode(node, renderNode)
  return renderNode
}

function createSlotRenderNodes(matchPathStep: MatchPath, url: string[]): SlotRenderNodes | undefined {
  const searchNode = matchPathStep.searchNode
  const mainParams = getMatchPathParams(matchPathStep, {})
  const slotRenderNodes: SlotRenderNodes = {}

  for (const [slotName, slotSearchTree] of searchNode.slots ?? []) {
    const slotMatchPath = createMatchPath(slotSearchTree, url)
    const result = createRenderLeaf(slotMatchPath, url, mainParams)
    if (result) slotRenderNodes[slotName] = createRenderNodeChain(result.routeNode, result.leaf)
  }
  if (Object.keys(slotRenderNodes).length)
    return slotRenderNodes
}

function createRenderNodeChainWithSlots(routeNode: RouteNode, mainRenderLeaf: RenderNode, url: string[], slotMatchPaths: MatchPath[]): RenderNode {
  let renderNode = mainRenderLeaf
  let node: RouteNode | undefined = routeNode

  for (; node; node = node.parent) { // For each route node in the match path leaf
    const slotMatchPath = slotMatchPaths.find(matchPath => matchPath.searchNode.routeNode === node)
    const slotRenderNodes = slotMatchPath && createSlotRenderNodes(slotMatchPath, url)
    renderNode = wrapRenderNode(node, renderNode, slotRenderNodes)
  }
  return renderNode
}

/** Returns whether the main children route matched a real page, together with
 *  the render tree. `success` is false for default/notfound fallbacks and when
 *  nothing can be rendered. */
export function createRenderTree(urlString: string, searchTree: SearchNode): [success: boolean, renderTree?: RenderNode] {
  const url = urlString.split('/').filter(Boolean)       // Convert url string to a list of segments
  const mainMatchPath = createMatchPath(searchTree, url) // Find search node path with params that match the url
  const mainResult = createRenderLeaf(mainMatchPath, url, {}) // Create the initial render node leaf
  if (!mainResult) return [false]                        // Return nothing if not even a fallback exists

  const { routeNode: mainRouteNode, leaf: mainRenderLeaf } = mainResult
  const slotMatchPaths = getSlotMatchPaths(mainMatchPath) // Find all match path links containing slots
  const renderTree = createRenderNodeChainWithSlots(mainRouteNode, mainRenderLeaf, url, slotMatchPaths) // Create main render chain
  return [mainRenderLeaf.moduleType === 'page', renderTree]
}
