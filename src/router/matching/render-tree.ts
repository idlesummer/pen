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

function createSlotRenderNode(matchNode: MatchNode, mainParams: ParamTable): RenderNode {
  const contentNode = getContentNode(matchNode)
  let currMatchNode: MatchNode | undefined = matchNode
  let childRenderNode = createRenderLeaf(matchNode, mainParams)

  forEachAncestor(contentNode, (routeNode) => {
    const params = routeNode.modulePaths.layout ? getParamTable(currMatchNode!) : undefined
    childRenderNode = wrapRenderNode(childRenderNode, routeNode.modulePaths, params)
    if (currMatchNode?.searchNode.anchor === routeNode)
      currMatchNode = currMatchNode.parent
  })
  return childRenderNode
}

function createSlotRenderNodes(matchNode: MatchNode): SlotRenderNodes | undefined {
  if (!matchNode.subtrees) return
  const params = getParamTable(matchNode)
  const slots = dict<RenderNode>()

  for (const [subtreeName, matchPath] of Object.entries(matchNode.subtrees))
    slots[subtreeName] = createSlotRenderNode(matchPath, params)
  return slots
}

function wrapAncestors(matchNode: MatchNode, childRenderNode: RenderNode): RenderNode {
  const contentNode = getContentNode(matchNode)
  let currMatchNode: MatchNode | undefined = matchNode

  forEachAncestor(contentNode, (routeNode) => {
    const params = routeNode.modulePaths.layout ? getParamTable(currMatchNode!) : undefined

    if (currMatchNode?.searchNode.anchor !== routeNode) // wrap only if non anchor
      childRenderNode = wrapRenderNode(childRenderNode, routeNode.modulePaths, params)
    else {
      const slots = createSlotRenderNodes(currMatchNode) // TODO: disallow @children slot name
      childRenderNode = wrapRenderNode(childRenderNode, routeNode.modulePaths, params, slots)
      currMatchNode = currMatchNode.parent
    }
  })
  return childRenderNode
}

/** Creates the render tree given the search tree and the URL. */
export function createRenderTree(url: string[], searchTree: SearchNode): RenderNode {
  const matchNode = createMatchTree(searchTree, url)
  const renderLeaf = createRenderLeaf(matchNode, {})
  const renderTree = wrapAncestors(matchNode, renderLeaf)
  return renderTree
}
