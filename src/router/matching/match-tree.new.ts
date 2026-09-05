import type { RouteNode } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree.new'
import { dict } from '@/lib/dict'
import { traverse } from '@/lib/traverse'

export type MatchNode = {
  searchNode: SearchNode
  // Runtime url metadata
  subtrees?: Record<string, MatchNode>  // winning match for each slot subtree
  position?: { type: 'static' | 'dynamic'; url: string } | { type: 'catchall'; url: string[] }
  page?: RouteNode    // matched accepting page/catchall; otherwise render searchNode.default
  // Tree
  parent?: MatchNode  // tree structure - which node led here, independent of how
  isTerminal?: true   // internal signal to check if match node is terminal
}

function createMatchNodeChildren(parent: MatchNode, url: string[]): MatchNode[] {
  const parentSearchNode = parent.searchNode
  const segment = url[parentSearchNode.urlDepth+1] // get next url segment
  if (!segment) return [] // url is exhausted - nothing left to consume, so no children

  const { statics, dynamic, catchall } = parentSearchNode
  const children: MatchNode[] = []

  if (statics?.[segment])
    children.push({
      searchNode: statics[segment],
      parent,
      position: { type: 'static', url: segment },
    })
  if (dynamic)
    children.push({
      searchNode: dynamic,
      parent,
      position: { type: 'dynamic', url: segment },
    })
  if (catchall) {
    const segments = url.slice(parentSearchNode.urlDepth+1) // always non-empty since segment is defined here
    children.push({
      searchNode: catchall,
      parent,
      position: { type: 'catchall', url: segments },
    })
  }
  return children
}

function createMatchPath(searchTree: SearchNode, url: string[]): MatchNode {
  const matchNodeRoot: MatchNode = { searchNode: searchTree }
  let winnerNode: MatchNode | undefined
  let bestStatic: MatchNode | undefined // most static-preferring failed branch seen so far

  traverse(matchNodeRoot, {
    expand: (matchNode) => {
      const children = createMatchNodeChildren(matchNode, url)
      if (!children.length) matchNode.isTerminal = true // set to be read by leave
      return children
    },
    leave: (matchNode) => {
      const { searchNode, position } = matchNode
      const isExhausted = !url[searchNode.urlDepth+1]
      const isAccepting = isExhausted || position?.type === 'catchall' // check for exhaustion or catchall

      if (isAccepting && searchNode.page) {
        matchNode.page = searchNode.page
        winnerNode = matchNode
        return true
      }
      else if (matchNode.isTerminal) {  // store as candidate if terminal (farthest possible match)
        if (!bestStatic || searchNode.staticness > bestStatic.searchNode.staticness)
          bestStatic = matchNode
      }
      // else, try another branch in the parent (all children were visited but no winner)
    },
  })
  return winnerNode ?? bestStatic! // guaranteed since url or tree eventually exhausts (safe to assert)
}

/** Walks up the winning path, finds slots on each node, creates their
 *  match paths, and attaches them to the corresponding node. */
export function createMatchTree(searchTree: SearchNode, url: string[]): MatchNode {
  const match = createMatchPath(searchTree, url)
  for (let node: MatchNode | undefined = match; node; node = node.parent) {
    if (!node.searchNode.slots) continue

    node.subtrees = dict()
    for (const [slotName, slotSearchTree] of Object.entries(node.searchNode.slots))
      node.subtrees[slotName] = createMatchPath(slotSearchTree, url)
  }
  return match
}
