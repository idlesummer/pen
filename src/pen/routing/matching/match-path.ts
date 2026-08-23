import type { RouteNode } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree'
import { traverse } from '@/lib/traverse'

export type MatchNode = {
  searchNode: SearchNode
  // Match metadata
  acceptingNode?: RouteNode   // page/catchall of the searchNode, set here so that later pipeline doesn't have to
  dynamicCapture?: string     // captured url value for dynamic node
  catchallCapture?: string[]  // captured url tail of this node's catchall child route; implies acceptingNode exists
  parent?: MatchNode
  subtrees?: Map<string, MatchNode>  // each slot's own winning match, resolved eagerly by createMatchTree
}

function createMatchNodeChildren(parent: MatchNode, nextUrlPart?: string): MatchNode[] {
  if (!nextUrlPart) // check if URL is exhausted by checking whether the next segment exists
    return []

  const parentSearchNode = parent.searchNode
  const matchNodeChildren: MatchNode[] = []
  const staticChild = parentSearchNode.statics?.get(nextUrlPart)  // query url part in next node children
  const dynamicChild = parentSearchNode.dynamic

  if (staticChild)  matchNodeChildren.push({ searchNode: staticChild, parent })
  if (dynamicChild) matchNodeChildren.push({ searchNode: dynamicChild, dynamicCapture: nextUrlPart, parent })
  return matchNodeChildren
}

/* `winner`    - means a match was found
 * `failed`    - means can't match further (either url or tree was exhausted)
 * `undefined` - means all children were visited but no winner (so try another branch in the parent) */
function classifyMatchNode(matchNode: MatchNode, nextUrlPart?: string): ['winner', RouteNode] | ['failed'] | undefined {
  const searchNode = matchNode.searchNode
  if (!nextUrlPart)                                                 // if url exhausted + has a page
    return searchNode.page ? ['winner', searchNode.page] : ['failed']

  if (searchNode.catchall)
    return ['winner', searchNode.catchall]                          // if url not exhausted and catchall

  if (!searchNode.statics?.get(nextUrlPart) && !searchNode.dynamic) // if no child can consume nextUrlPart
    return ['failed']  // means tree is exhausted (no static/dynamic childen)
}

function isBetterDefaultNode(candidate: MatchNode, bestDefaultNode: MatchNode): boolean {
  return candidate.searchNode.staticness > bestDefaultNode.searchNode.staticness
}

function createMatchPath(searchTree: SearchNode, url: string[]): MatchNode {
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

      if (matchStatus === 'failed') {
        if (!bestDefaultPath || isBetterDefaultNode(matchNode, bestDefaultPath))
          bestDefaultPath = matchNode
      }
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
 *  Resolves each slot via createMatchPath directly, not by recursing into
 *  createMatchTree itself - a slot's own chain can never itself contain
 *  further slots (sanitizeRouteTree prunes nested slots at compile time),
 *  so there's nothing further a slot's own resolution would need to check for. */
export function createMatchTree(searchTree: SearchNode, url: string[]): MatchNode {
  const mainMatchNode = createMatchPath(searchTree, url)
  for (let node: MatchNode | undefined = mainMatchNode; node; node = node.parent) {
    if (!node.searchNode.slots) continue
    const subtrees = new Map<string, MatchNode>()
    for (const [slotName, slotSearchTree] of node.searchNode.slots)
      subtrees.set(slotName, createMatchPath(slotSearchTree, url))
    node.subtrees = subtrees
  }
  return mainMatchNode
}
