import type { RouteNode } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree'
import { traverse } from '@/lib/traverse'

export type ParamTable = Record<string, string | string[]> // dynamic route parameters or catchall parameters as string arrays
export type MatchNode = {
  searchNode: SearchNode
  // Match metadata
  acceptingNode?: RouteNode   // the page/catchall this step resolved to, set by classifyMatchNode once it settles a winner
  dynamicCapture?: string     // captured url value for dynamic node
  catchallCapture?: string[]  // the captured tail segments, only set when acceptingNode came from a catchall
  parent?: MatchNode
}

function createMatchNodeChildren(parentMatchNode: MatchNode, url: string[]): MatchNode[] {
  const parentSearchNode = parentMatchNode.searchNode
  const urlPart = url[parentSearchNode.urlDepth+1]
  if (urlPart === undefined)  // check if URL is exhausted by checking whether the next segment exists
    return []

  const matchNodeChildren: MatchNode[] = []
  const staticChild = parentSearchNode.statics?.get(urlPart)
  const dynamicChild = parentSearchNode.dynamic

  if (staticChild) {
    const searchNode = staticChild
    const parent = parentMatchNode
    matchNodeChildren.push({ searchNode, parent })
  }
  if (dynamicChild) {
    const searchNode = dynamicChild
    const parent = parentMatchNode
    const dynamicCapture = urlPart
    matchNodeChildren.push({ searchNode, parent, dynamicCapture })
  }
  return matchNodeChildren
}

function classifyMatchNode(matchNode: MatchNode, url: string[]): 'winner' | 'candidate' | undefined {
  const searchNode = matchNode.searchNode
  const urlPart = url[searchNode.urlDepth+1]  // if urlPart is undefined it means it's exhausted

  if (urlPart === undefined) {
    if (!searchNode.page) return 'candidate'  // if url is exhausted (and no page)
    matchNode.acceptingNode = searchNode.page // if url exhausted + has a page
    return 'winner'
  }
  if (searchNode.catchall) {
    matchNode.acceptingNode = searchNode.catchall
    matchNode.catchallCapture = url.slice(searchNode.urlDepth+1)
    return 'winner'     // if catchall (only once segments remain - it needs one or more)
  }
  const staticSearchNode = searchNode.statics?.get(urlPart)
  if (!staticSearchNode && !searchNode.dynamic)
    return 'candidate'  // if tree is exhausted (no static/dynamic nodes)
}

function isBetterDefaultNode(candidate: MatchNode, bestDefaultNode?: MatchNode): boolean {
  return !bestDefaultNode || candidate.searchNode.staticness > bestDefaultNode.searchNode.staticness
}

/** Finds the winning MatchNode for one tree: a real match if traversal
 *  found one, or - failing that - whichever failed branch was most
 *  static-preferring. Callers interpret what it resolved to themselves. */
export function createMatchPath(searchTree: SearchNode, url: string[]): MatchNode {
  const matchTree: MatchNode = { searchNode: searchTree }
  let bestMatchPath: MatchNode | undefined
  let bestDefaultPath: MatchNode | undefined  // most static-preferring failed branch seen so far

  traverse(matchTree, {   // Performs a regular MatchNode traversal restricted to static and dynamic
    expand: (matchNode) =>
      createMatchNodeChildren(matchNode, url),

    leave: (matchNode) => { // Once subtrees are visited,
      const matchClass = classifyMatchNode(matchNode, url)
      if (matchClass === 'winner')
        return (bestMatchPath = matchNode, true)
      if (matchClass === 'candidate' && isBetterDefaultNode(matchNode, bestDefaultPath))
        bestDefaultPath = matchNode
    },
  })
  return bestMatchPath ?? bestDefaultPath!  // guaranteed since url or tree eventually exhausts (safe to assert)
}

/** Assembles the params accumulated by walking matchNode's own chain -
 *  callers combine this with any inherited table themselves. */
export function getParamTable(matchNode: MatchNode): ParamTable {
  const paramTable: ParamTable = {}
  for (let node: MatchNode | undefined = matchNode; node; node = node.parent) {
    if (node.dynamicCapture === undefined) continue
    const dynamicNode = node.searchNode.anchor
    const paramName = dynamicNode.segment.value
    paramTable[paramName] = node.dynamicCapture
  }
  return paramTable
}

/** Creates a reverse look up for slot-bearing RouteNodes to its corresponding MatchNode. */
export function getSlotMatchNodes(matchNode: MatchNode): Map<RouteNode, MatchNode> {
  const slotMatchNodes = new Map<RouteNode, MatchNode>()
  for (let node: MatchNode | undefined = matchNode; node; node = node.parent) {
    if (node.searchNode.slots)
      slotMatchNodes.set(node.searchNode.anchor, node)
  }
  return slotMatchNodes
}
