import type { RouteNode } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree'
import { traverse } from '@/lib/traverse'

export type ParamTable = Record<string, string | string[]> // dynamic route parameters or catchall parameters as string arrays
export type MatchNode = {
  searchNode: SearchNode
  // Match metadata
  acceptingNode?: RouteNode   // page/catchall of the searchNode, set here so that later pipeline doesn't have to
  dynamicCapture?: string     // captured url value for dynamic node
  catchallCapture?: string[]  // captured url tail of this node's catchall child route; implies acceptingNode exists
  parent?: MatchNode
  slots?: Map<string, MatchNode>  // each slot's own winning match, resolved eagerly by createMatchTree
}

function createMatchNodeChildren(parentMatchNode: MatchNode, nextUrlPart?: string): MatchNode[] {
  if (nextUrlPart === undefined)  // check if URL is exhausted by checking whether the next segment exists
    return []

  const parentSearchNode = parentMatchNode.searchNode
  const matchNodeChildren: MatchNode[] = []
  const staticChild = parentSearchNode.statics?.get(nextUrlPart)  // query url part in next node children
  const dynamicChild = parentSearchNode.dynamic

  if (staticChild) {
    const searchNode = staticChild
    const parent = parentMatchNode
    matchNodeChildren.push({ searchNode, parent })
  }
  if (dynamicChild) {
    const searchNode = dynamicChild
    const parent = parentMatchNode
    const dynamicCapture = nextUrlPart  // Record how did I get to this search node
    matchNodeChildren.push({ searchNode, parent, dynamicCapture })
  }
  return matchNodeChildren
}

/* `winner` means a match was found
 * `failed` means can't match further (either url or tree was exhausted)
 * `undefined` means all children were visited but no winner (so try another branch in the parent) */
function classifyMatchNode(matchNode: MatchNode, nextUrlPart?: string): ['winner', RouteNode] | ['failed'] | undefined {
  const searchNode = matchNode.searchNode
  if (nextUrlPart === undefined)  // if url exhausted + has a page
    return searchNode.page ? ['winner', searchNode.page] : ['failed']
  if (searchNode.catchall)        // if url not exhausted and catchall
    return ['winner', searchNode.catchall]

  const staticSearchNode = searchNode.statics?.get(nextUrlPart)
  if (!staticSearchNode && !searchNode.dynamic) // no child can consume nextUrlPart
    return ['failed']  // means tree is exhausted (no static/dynamic childen)
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
    expand: (matchNode) => {
      const searchNode = matchNode.searchNode
      const nextUrlPart = url[searchNode.urlDepth+1]
      return createMatchNodeChildren(matchNode, nextUrlPart)
    },
    leave: (matchNode) => {
      const searchNode = matchNode.searchNode
      const nextUrlPart = url[searchNode.urlDepth+1] // if urlPart is undefined it means it's exhausted
      const [matchStatus, acceptingNode] = classifyMatchNode(matchNode, nextUrlPart) ?? []

      if (matchStatus === 'failed' && isBetterDefaultNode(matchNode, bestDefaultPath))
        bestDefaultPath = matchNode
      else if (matchStatus === 'winner') {
        matchNode.acceptingNode = acceptingNode
        if (acceptingNode === searchNode.catchall)  // if the accepting node was a catchall
          matchNode.catchallCapture = url.slice(searchNode.urlDepth+1) // capture the remaining params
        bestMatchPath = matchNode
        return true
      }
    },
  })
  return bestMatchPath ?? bestDefaultPath!  // guaranteed since url or tree eventually exhausts (safe to assert)
}

/** Wraps createMatchPath, eagerly resolving every slot along the winning
 *  chain so later pipeline stages never need createMatchPath or url again.
 *  Recurses into itself (not createMatchPath) per slot for symmetry with
 *  the main call - harmless since a slot's own chain can never itself
 *  contain slots (sanitizeRouteTree prunes nested slots at compile time),
 *  so the loop below just finds nothing further to resolve there. */
export function createMatchTree(searchTree: SearchNode, url: string[]): MatchNode {
  const matchNode = createMatchPath(searchTree, url)
  for (let node: MatchNode | undefined = matchNode; node; node = node.parent) {
    if (!node.searchNode.slots) continue
    const slots = new Map<string, MatchNode>()
    for (const [slotName, slotSearchTree] of node.searchNode.slots)
      slots.set(slotName, createMatchTree(slotSearchTree, url))
    node.slots = slots
  }
  return matchNode
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
