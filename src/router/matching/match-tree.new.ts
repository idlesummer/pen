import type { RouteNode } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree.new'
import { findDefaultRouteNodeParent } from '../compiling/route-tree'
import { dict } from '@/lib/dict'
import { traverse } from '@/lib/traverse'

export type MatchNode = {
  searchNode: SearchNode
  subtrees?: Record<string, Match>   // each slot's own winning match - attached after the main walk resolves
  isTerminal?: true
  position?:
    | { type: 'static' | 'dynamic'; url: string; parent: MatchNode }
    | { type: 'catchall'; url: string[]; parent: MatchNode } // captured at birth - the catchall's own SearchNode makes this knowable immediately, no leave-time wait needed
}

export type Page = {
  type: 'page' | 'default'
  node: RouteNode
}

export type Match = {
  node: MatchNode  // the winning chain - walk .position.parent to collect dynamic params
  page: Page        // the accepting decision - which RouteNode, real page/catchall or default fallback
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
      position: { type: 'static', url: segment, parent },
    })
  if (dynamic)
    children.push({
      searchNode: dynamic,
      position: { type: 'dynamic', url: segment, parent },
    })
  if (catchall) {
    const tail = url.slice(parentSearchNode.urlDepth+1) // always non-empty since segment is defined here
    children.push({
      searchNode: catchall,
      position: { type: 'catchall', url: tail, parent },
    })
  }
  return children
}

function createMatchPath(searchTree: SearchNode, url: string[]): Match {
  const root: MatchNode = { searchNode: searchTree }
  let winnerNode: MatchNode | undefined
  let winnerPage: Page | undefined
  let bestStatic: MatchNode | undefined // most static-preferring failed branch seen so far

  traverse(root, {   // Performs a regular MatchNode traversal restricted to static/dynamic/catchall
    expand: (matchNode) => {
      const children = createMatchNodeChildren(matchNode, url)
      if (!children.length) matchNode.isTerminal = true
      return children
    },
    leave: (matchNode) => {
      const { searchNode, position } = matchNode
      const isExhausted = !url[searchNode.urlDepth+1]
      const isAccepting = isExhausted || position?.type === 'catchall' // check for exhaustion or catchall

      if (isAccepting && searchNode.page) {
        winnerNode = matchNode
        winnerPage = { type: 'page', node: searchNode.page }
        return true
      }
      // store match node as candidate if terminal (farthest possible match)
      else if (matchNode.isTerminal) {
        if (!bestStatic || searchNode.staticness > bestStatic.searchNode.staticness)
          bestStatic = matchNode
      }
      // else, try another branch in the parent (all children were visited but no winner)
    },
  })
  if (winnerNode && winnerPage)
    return { node: winnerNode, page: winnerPage }

  const node = bestStatic! // guaranteed since url or tree eventually exhausts (safe to assert)
  const defaultNode = findDefaultRouteNodeParent(node.searchNode.anchor)
  return { node, page: { type: 'default', node: defaultNode } }
}

/** Walks up the winning path, finds slots on each node, creates their
 *  match paths, and attaches them to the corresponding node. */
export function createMatchTree(searchTree: SearchNode, url: string[]): Match {
  const match = createMainMatchPath(searchTree, url)
  for (let node: MatchNode | undefined = match.node; node; node = node.position?.parent) {
    if (!node.searchNode.slots) continue

    node.subtrees = dict()
    for (const [slotName, slotSearchTree] of Object.entries(node.searchNode.slots))
      node.subtrees[slotName] = createMainMatchPath(slotSearchTree, url)
  }
  return match
}
