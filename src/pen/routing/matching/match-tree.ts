import type { RouteNode } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree'
import { findDefaultRouteNodeParent } from '../compiling/route-tree'
import { hasConsumingChild } from '../compiling/search-tree'
import { traverse } from '@/lib/traverse'

export type MatchNode = {
  searchNode: SearchNode
  // Match metadata
  leafContent?: [
    type: 'page' | 'default',       // which kind of module the node provides
    node: RouteNode,                // page/catchall accepted by the searchNode, or nearest default ancestor if none was found
    catchallParams?: string[],      // captured url tail of this node's catchall child route; only set when type is 'page'
  ]                                 // never set on an ancestor - exactly one node per createMatchPath call gets this
  dynamicParam?: string             // captured url value for dynamic node
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
  if (dynamicChild) matchNodeChildren.push({ searchNode: dynamicChild, dynamicParam: nextUrlPart, parent })
  return matchNodeChildren
}

function isMoreStatic(candidate: MatchNode, current: MatchNode): boolean {
  return candidate.searchNode.staticness > current.searchNode.staticness
}

function createDefaultContent(matchNode: MatchNode): ['default', RouteNode] | undefined {
  const contentNode = findDefaultRouteNodeParent(matchNode.searchNode.anchor)
  return contentNode && ['default', contentNode]
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
      const contentNode = nextUrlPart ? searchNode.catchall : searchNode.page

      // handle winning match if a contentNode exists
      if (contentNode) {
        const catchallParams = nextUrlPart ? url.slice(searchNode.urlDepth+1) : undefined
        matchNode.leafContent = ['page', contentNode, catchallParams]
        bestMatchPath = matchNode
        return true
      }
      // handle fallback candidate if URL is exhausted or the current node has no matching child
      else if (!nextUrlPart || !hasConsumingChild(searchNode, nextUrlPart)) {
        if (!bestStaticPath || isMoreStatic(matchNode, bestStaticPath))
          bestStaticPath = matchNode
      }
      // else, try another branch in the parent (all children were visited but no winner)
    },
  })
  const matchNode = bestMatchPath ?? bestStaticPath!  // guaranteed since url or tree eventually exhausts (safe to assert)
  matchNode.leafContent ??= createDefaultContent(matchNode) // populate default node if no true match was found
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
