import type { RouteNode } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree'
import { findDefaultRouteNodeParent } from '../compiling/route-tree'
import { dict } from '@/lib/dict'
import { traverse } from '@/lib/traverse'

export type MatchContent = {
  type: 'page' | 'default'  // content means page/catchall (acceptingNode) or default
  node: RouteNode           // page/catchall accepted by the searchNode, or nearest default ancestor if none was found
  catchallParams?: string[] // captured url tail of this node's catchall child route; only set when type is 'page'
}

export type MatchNode = {
  searchNode: SearchNode
  parent?: MatchNode
  subtrees?: Record<string, MatchNode>  // each slot's own winning match
  // Match metadata
  dynamicParam?: string                 // captured url value for dynamic node
  isTerminal?: true                     // set when match node has no children
  content?: MatchContent                // values needed for render leaf (only terminal nodes has this)
}

export type MatchTree =
  MatchNode & Required<Pick<MatchNode, 'content'>>

function createMatchNodeChildren(parent: MatchNode, nextUrlPart?: string): MatchNode[] {
  if (!nextUrlPart) return [] // check if URL is exhausted by checking whether the next segment exists
  const parentSearchNode = parent.searchNode
  const matchNodeChildren: MatchNode[] = []
  const staticChild = parentSearchNode.statics?.[nextUrlPart]  // query url part in next node children
  const dynamicChild = parentSearchNode.dynamic

  if (staticChild)  matchNodeChildren.push({ searchNode: staticChild, parent })
  if (dynamicChild) matchNodeChildren.push({ searchNode: dynamicChild, dynamicParam: nextUrlPart, parent })
  return matchNodeChildren
}

function createDefaultContent(matchNode: MatchNode): MatchContent | undefined {
  const contentNode = findDefaultRouteNodeParent(matchNode.searchNode.anchor)
  return contentNode && { type: 'default', node: contentNode }
}

function createMatchPath(searchTree: SearchNode, url: string[]): MatchNode {
  const matchTree: MatchNode = { searchNode: searchTree }
  let bestMatch: MatchNode | undefined
  let bestStatic: MatchNode | undefined // most static-preferring failed branch seen so far

  traverse(matchTree, {   // Performs a regular MatchNode traversal restricted to static and dynamic
    expand: (matchNode) => {
      const searchNode = matchNode.searchNode
      const nextUrlPart = url[searchNode.urlDepth+1]
      const children = createMatchNodeChildren(matchNode, nextUrlPart)
      if (!children.length) matchNode.isTerminal = true
      return children
    },
    leave: (matchNode) => {
      const searchNode = matchNode.searchNode
      const nextUrlPart = url[searchNode.urlDepth+1] // if urlPart is undefined it means it's exhausted
      const acceptingNode = nextUrlPart ? searchNode.catchall : searchNode.page

      // handle winning match if an accepting node exists
      if (acceptingNode) {
        const catchallParams = nextUrlPart ? url.slice(searchNode.urlDepth+1) : undefined
        matchNode.content = { type: 'page', node: acceptingNode, catchallParams }
        bestMatch = matchNode
        return true
      }
      // store match node as candidate if terminal (farthest possible match)
      else if (matchNode.isTerminal) {
        if (!bestStatic || matchNode.searchNode.staticness > bestStatic.searchNode.staticness)
          bestStatic = matchNode
      }
      // else, try another branch in the parent (all children were visited but no winner)
    },
  })
  const matchNode = bestMatch ?? bestStatic!  // guaranteed since url or tree eventually exhausts (safe to assert)
  matchNode.content ??= createDefaultContent(matchNode) // populate default node if no true match was found
  return matchNode
}

/** Walks up the winning path, finds slots on each node, creates their
 *  match paths, and attaches them to the corresponding node. */
export function createMatchTree(searchTree: SearchNode, url: string[]): MatchTree {
  const mainMatchNode = createMatchPath(searchTree, url) as MatchTree // safe since content always exists
  for (let node: MatchNode | undefined = mainMatchNode; node; node = node.parent) {
    if (!node.searchNode.slots) continue

    node.subtrees = dict()
    for (const [slotName, searchSubtree] of Object.entries(node.searchNode.slots))
      node.subtrees[slotName] = createMatchPath(searchSubtree, url)
  }
  return mainMatchNode
}
