import type { RouteNode } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree'
import type { ParamTable, MatchNode } from './match-path'
import { traverse } from '@/lib/traverse'
import { getRoutePath, getRouteNodeParentIfNotSlot, findDefaultRouteNodeParent } from '../compiling/route-tree'
import { createMatchPath, getParamTable } from './match-path'

type RenderLeaf = {
  routePath: string
  moduleType: 'page' | 'default' // page or default
  modulePath: string
  paramTable: ParamTable
}

type RenderSubtrees = Record<string, RenderNode> // contains SlotRenderNode
export type RenderNode = RenderLeaf | {
  routePath: string
  layout?: string
  loading?: string
  error?: string
  slots: RenderSubtrees
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

function wrapRenderNode(routeNode: RouteNode, childRenderNode: RenderNode, renderSubtrees?: RenderSubtrees): RenderNode {
  const { layout, loading, error } = routeNode.modulePaths
  if (!layout && !loading && !error && !renderSubtrees)
    return childRenderNode

  const routePath = getRoutePath(routeNode)
  const slots = renderSubtrees ?? {} // warn users to not modify prototype chain
  slots.children = childRenderNode
  return { routePath, layout, loading, error, slots }
}

type RenderNodeFrame = {
  routeNode: RouteNode
  matchNode?: MatchNode
  renderNode: RenderNode
  parent?: RenderNodeFrame
  slotName?: string
  renderSubtrees?: RenderSubtrees
}

/** Builds a RenderNode chain using the shared `traverse` utility so slot
 *  subtrees do not require recursive calls between createRenderNodeChain
 *  and createRenderSubtrees. */
function createRenderNodeChain(renderLeaf: RenderNode, routeNode: RouteNode, matchNode: MatchNode, url: string[]): RenderNode {
  const rootFrame: RenderNodeFrame = { routeNode, matchNode, renderNode: renderLeaf }

  traverse(rootFrame, {
    expand: (frame) => {
      const matched = frame.matchNode?.searchNode.anchor === frame.routeNode
      const renderSubtrees = matched ? {} : undefined
      const slotEntries = matched ? [...frame.matchNode!.searchNode.slots ?? []] : []

      const childFrames: RenderNodeFrame[] = []
      const mainParamTable = matched ? getParamTable(frame.matchNode!) : undefined

      for (const [slotName, slotSearchTree] of slotEntries) {
        const slotMatchPath = createMatchPath(slotSearchTree, url)
        const context = createRenderLeaf(slotMatchPath, mainParamTable!)
        if (context === undefined)
          continue

        const [slotRenderLeaf, slotRouteNode] = context
        childFrames.push({ routeNode: slotRouteNode, matchNode: slotMatchPath, renderNode: slotRenderLeaf, parent: frame, slotName })
      }

      frame.renderSubtrees = renderSubtrees

      frame.renderNode = wrapRenderNode(
        frame.routeNode,
        frame.renderNode,
        Object.keys(renderSubtrees ?? {}).length ? renderSubtrees : undefined,
      )

      const parentRouteNode = getRouteNodeParentIfNotSlot(frame.routeNode)

      if (parentRouteNode) {
        frame.routeNode = parentRouteNode
        if (matched)
          frame.matchNode = frame.matchNode!.parent
      }

      if (childFrames.length)
        return childFrames

      if (parentRouteNode)
        return [{ ...frame }] // continue stepping up through routeNode levels as a synthetic child

      if (frame.parent)
        frame.parent.renderSubtrees![frame.slotName!] = frame.renderNode

      return null
    },
  })

  return rootFrame.renderNode
}

/** Returns whether the main children route matched a real page, together with
 *  the render tree. `success` is false for default fallbacks and when nothing
 *  can be rendered. */
export function createRenderTree(urlString: string, searchTree: SearchNode): [success: boolean, renderTree?: RenderNode] {
  const url = urlString.split('/') // Convert to url string array, url[0] is always '' (root's own position)
  const mainMatchPath = createMatchPath(searchTree, url) // Find search node path with params that match the url
  const mainContext = createRenderLeaf(mainMatchPath, {}) // Create the initial render node leaf
  if (!mainContext) return [false] // Return nothing if not even a fallback exists

  const [mainRenderLeaf, mainRouteNode] = mainContext
  const renderTree = createRenderNodeChain(mainRenderLeaf, mainRouteNode, mainMatchPath, url)
  return [mainRenderLeaf.moduleType === 'page', renderTree]
}
