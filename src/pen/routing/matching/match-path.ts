import type { RouteNode } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree'
import { traverse } from '@/lib/traverse'

export type ParamTable = Record<string, string | string[]> // dynamic route parameters or catchall parameters as string arrays
export type MatchNode = {
  searchNode: SearchNode
  // Match metadata
  acceptingNode?: RouteNode   // page/catchall of the searchNode, set here so that later pipeline doesn't have to
  dynamicCapture?: string     // captured url value for dynamic node
  catchallCapture?: string[]  // captured url tail of this node's catchall child route
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
    const dynamicCapture = urlPart // Record how did I get to this search node
    matchNodeChildren.push({ searchNode, parent, dynamicCapture })
  }
  return matchNodeChildren
}

function classifyMatchNode(matchNode: MatchNode, nextUrlPart?: string): ['winner', RouteNode] | ['candidate'] | undefined {
  const searchNode = matchNode.searchNode
  if (nextUrlPart === undefined)  // if url exhausted + has a page
    return searchNode.page ? ['winner', searchNode.page] : ['candidate']
  if (searchNode.catchall)
    return ['winner', searchNode.catchall]

  const staticSearchNode = searchNode.statics?.get(nextUrlPart) // check for static children
  if (!staticSearchNode && !searchNode.dynamic)
    return ['candidate']  // if tree is exhausted (no static/dynamic nodes)

  // Return undefined if URL remains and this node can continue matching
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
      const searchNode = matchNode.searchNode
      const nextUrlPart = url[searchNode.urlDepth+1] // if urlPart is undefined it means it's exhausted
      const [matchClass, acceptingNode] = classifyMatchNode(matchNode, nextUrlPart) ?? []

      if (matchClass === 'winner') {
        matchNode.acceptingNode = acceptingNode
        if (acceptingNode === searchNode.catchall)  // if the accepting node was a catchall
          matchNode.catchallCapture = url.slice(searchNode.urlDepth+1) // capture the remaining params

        bestMatchPath = matchNode
        return true
      }
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
