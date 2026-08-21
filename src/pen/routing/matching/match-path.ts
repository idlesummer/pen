import type { RouteNode } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree'
import { traverse } from '@/lib/traverse'
import { getDynamicParamName } from '../compiling/search-tree'

export type ParamTable = Record<string, string | string[]> // dynamic route parameters or catchall parameters as string arrays
export type MatchNode = {
  searchNode: SearchNode
  acceptingNode?: RouteNode       // the page/catchall this step resolved to, set by classifyMatchNode once it settles a winner
  dynamicParamValue?: string      // the dynamic param value this step itself captured, if any - the name is searchNode's own, via getDynamicParamName
  catchallParamValues?: string[]  // the captured tail segments, only set when acceptingNode came from a catchall
  parent?: MatchNode              // the step before this one; undefined at the root
}

function createMatchNodeChildren(parentMatchNode: MatchNode, url: string[]): MatchNode[] {
  const parentSearchNode = parentMatchNode.searchNode
  const urlPart = url[parentSearchNode.urlPos+1]
  if (urlPart === undefined)  // check if URL is exhausted by checking whether the next segment exists
    return []

  const childMatchNodes: MatchNode[] = []
  const staticChild = parentSearchNode.statics?.get(urlPart)
  const dynamicChild = parentSearchNode.dynamic

  if (staticChild) {
    const searchNode = staticChild
    const parent = parentMatchNode
    childMatchNodes.push({ searchNode, parent })
  }
  if (dynamicChild && urlPart) {
    const searchNode = dynamicChild
    const parent = parentMatchNode
    const dynamicParamValue = urlPart
    childMatchNodes.push({ searchNode, parent, dynamicParamValue })
  }
  return childMatchNodes
}

/** Returns a 'winner' or 'candidate' if url or tree exhausts. Settles the
 *  winning matchNode's acceptingNode (and catchallParamValues, for catchalls)
 *  here, once, so callers never re-derive them from url/urlPos again. */
function classifyMatchNode(matchNode: MatchNode, url: string[]): 'winner' | 'candidate' | undefined {
  const searchNode = matchNode.searchNode
  const urlPart = url[searchNode.urlPos+1]

  if (urlPart === undefined) {  // means url is exhausted
    if (!searchNode.page) return 'candidate'
    matchNode.acceptingNode = searchNode.page
    return 'winner'
  }
  if (searchNode.catchall) {
    matchNode.acceptingNode = searchNode.catchall
    matchNode.catchallParamValues = url.slice(searchNode.urlPos+1)
    return 'winner'
  }
  const staticSearchNode = searchNode.statics?.get(urlPart)
  const dynamicSearchNode = urlPart.length ? searchNode.dynamic : undefined  // dynamic rejects empty-string captures
  if (!staticSearchNode && !dynamicSearchNode)  // no static/dynamic nodes means tree is exhausted
    return 'candidate'
}

function isBetterDefaultNode(candidate: MatchNode, bestDefaultNode?: MatchNode): boolean {
  return !bestDefaultNode || candidate.searchNode.staticness > bestDefaultNode.searchNode.staticness
}

/** Finds the winning MatchNode for one tree: a real match if traversal
 *  found one, or - failing that - whichever failed branch was most
 *  static-preferring. Callers interpret what it resolved to themselves. */
export function createMatchNode(searchTree: SearchNode, url: string[]): MatchNode {
  const matchTree: MatchNode = { searchNode: searchTree }
  let bestMatchNode: MatchNode | undefined
  let bestDefaultNode: MatchNode | undefined  // most static-preferring failed branch seen so far

  traverse(matchTree, {   // Performs a regular MatchNode traversal restricted to static and dynamic
    expand: (matchNode) =>
      createMatchNodeChildren(matchNode, url),

    leave: (matchNode) => { // Once subtrees are visited,
      const matchClass = classifyMatchNode(matchNode, url)
      if (matchClass === 'winner')
        return (bestMatchNode = matchNode, true)
      if (matchClass === 'candidate' && isBetterDefaultNode(matchNode, bestDefaultNode))
        bestDefaultNode = matchNode
    },
  })
  return bestMatchNode ?? bestDefaultNode!  // guaranteed since url or tree eventually exhausts (safe to assert)
}

/** Assembles the params accumulated by walking matchNode's own chain -
 *  callers combine this with any inherited table themselves. */
export function getParamTable(matchNode: MatchNode): ParamTable {
  const paramTable: ParamTable = {}
  for (let node: MatchNode | undefined = matchNode; node; node = node.parent) {
    if (node.dynamicParamValue !== undefined)
      paramTable[getDynamicParamName(node.searchNode)] = node.dynamicParamValue
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
