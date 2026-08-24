import type { RouteNode } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree'
import { findDefaultRouteNodeParent } from '../compiling/route-tree'
import { traverse } from '@/lib/traverse'

export type MatchNode = {
  searchNode: SearchNode
  // Match metadata
  content?: [
    type: 'page' | 'default',       // which kind of module contentNode provides
    node: RouteNode,                // page/catchall accepted by the searchNode, or nearest default ancestor if none was found
  ]
  dynamicCapture?: string           // captured url value for dynamic node
  catchallCapture?: string[]        // captured url tail of this node's catchall child route; implies contentType is 'page'
  parent?: MatchNode
  subtrees?: Map<string, MatchNode> // each slot's own winning match
}

function createMatchNodeChildren(parent: MatchNode, nextUrlPart?: string): MatchNode[] {
  if (!nextUrlPart) return [] // check if URL is exhausted by checking whether the next segment exists

  const parentSearchNode = parent.searchNode
  const matchNodeChildren: MatchNode[] = []
  const staticChild = parentSearchNode.statics?.get(nextUrlPart)  // query url part in next node children
  const dynamicChild = parentSearchNode.dynamic

  if (staticChild)  matchNodeChildren.push({ searchNode: staticChild, parent })
  if (dynamicChild) matchNodeChildren.push({ searchNode: dynamicChild, dynamicCapture: nextUrlPart, parent })
  return matchNodeChildren
}

/* `winner`    - a match was found
 * `failed`    - can't match further (either url or tree was exhausted)
 * `undefined` - all children were visited but no winner (so try another branch in the parent) */
function classifyMatchNode(matchNode: MatchNode, nextUrlPart?: string): ['winner', RouteNode] | ['failed'] | undefined {
  const searchNode = matchNode.searchNode
  if (!nextUrlPart)                                                 // if url exhausted + has a page
    return searchNode.page ? ['winner', searchNode.page] : ['failed']
  if (searchNode.catchall)                                          // if url not exhausted and catchall
    return ['winner', searchNode.catchall]
  if (!searchNode.statics?.get(nextUrlPart) && !searchNode.dynamic) // if no child can consume nextUrlPart (or tree exhausted)
    return ['failed']
}

function isBetterStaticNode(candidate: MatchNode, bestStaticNode: MatchNode): boolean {
  return candidate.searchNode.staticness > bestStaticNode.searchNode.staticness
}

function createMatchPath(searchTree: SearchNode, url: string[]): MatchNode {
  const matchTree: MatchNode = { searchNode: searchTree }
  let bestMatchPath: MatchNode | undefined
  let bestStaticPath: MatchNode | undefined // most static-preferring failed branch seen so far

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
        if (!bestStaticPath || isBetterStaticNode(matchNode, bestStaticPath))
          bestStaticPath = matchNode
      }
      else if (matchStatus === 'winner') {
        matchNode.content = ['page', acceptingNode]
        if (acceptingNode === searchNode.catchall)  // if the accepting node was a catchall
          matchNode.catchallCapture = url.slice(searchNode.urlDepth+1) // capture the remaining params
        bestMatchPath = matchNode
        return true
      }
    },
  })
  const matchNode = bestMatchPath ?? bestStaticPath!  // guaranteed since url or tree eventually exhausts (safe to assert)
  if (!matchNode.content) {                       // populate default node if no true match was found
    const contentNode = findDefaultRouteNodeParent(matchNode.searchNode.anchor)
    if (contentNode)
      matchNode.content = ['default', contentNode]
  }
  return matchNode
}

/** Walks up the winning path, finds slots on each node, creates their
 *  match paths, and attaches them to the corresponding node. */
export function createMatchTree(searchTree: SearchNode, url: string[]): MatchNode {
  const mainMatchNode = createMatchPath(searchTree, url)
  for (let node: MatchNode | undefined = mainMatchNode; node; node = node.parent) {
    if (!node.searchNode.slots) continue

    node.subtrees = new Map()
    for (const [slotName, searchSubtree] of node.searchNode.slots)
      node.subtrees.set(slotName, createMatchPath(searchSubtree, url))
  }
  return mainMatchNode
}
