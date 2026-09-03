import type { RouteNode } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree.new'
import { findDefaultRouteNodeParent } from '../compiling/route-tree'
import { dict } from '@/lib/dict'
import { traverse } from '@/lib/traverse'

export type MatchNode = {
  searchNode: SearchNode
  subtrees?: Record<string, Match>   // each slot's own winning match - attached after the main walk resolves
  _isTerminal?: true
  position?:
    | { type: 'static' | 'dynamic'; segment: string; parent: MatchNode }
    | { type: 'catchall'; segments: string[]; parent: MatchNode } // captured at birth - the catchall's own SearchNode makes this knowable immediately, no leave-time wait needed
}

export type Page = {
  type: 'page' | 'default'
  node: RouteNode
}

export type Match = {
  node: MatchNode  // the winning chain - walk .position.parent to collect dynamic params
  page: Page        // the accepting decision - which RouteNode, real page/catchall or default fallback
}

function createMatchNodeChildren(parent: MatchNode, nextUrlPart: string | undefined, url: string[]): MatchNode[] {
  if (!nextUrlPart) return [] // url is exhausted - nothing left to consume, so no children
  const parentSearchNode = parent.searchNode
  const children: MatchNode[] = []

  const staticChild = parentSearchNode.statics?.[nextUrlPart]
  const dynamicChild = parentSearchNode.dynamic
  const catchallChild = parentSearchNode.catchall

  if (staticChild)
    children.push({ searchNode: staticChild, position: { type: 'static', segment: nextUrlPart, parent } })
  if (dynamicChild)
    children.push({ searchNode: dynamicChild, position: { type: 'dynamic', segment: nextUrlPart, parent } })
  if (catchallChild) {
    const segments = url.slice(parentSearchNode.urlDepth+1) // always non-empty since nextUrlPart is truthy here
    children.push({ searchNode: catchallChild, position: { type: 'catchall', segments, parent } })
  }
  return children
}

/** Walks a single tree (the main tree, or one slot's own) to find its
 *  winning match - a real page/catchall accept, or the nearest default
 *  fallback if nothing truly matched. */
function createMainMatchPath(searchTree: SearchNode, url: string[]): Match {
  const root: MatchNode = { searchNode: searchTree }
  let winner: MatchNode | undefined
  let winnerPage: Page | undefined
  let bestStatic: MatchNode | undefined // most static-preferring failed branch seen so far

  traverse(root, {   // Performs a regular MatchNode traversal restricted to static/dynamic/catchall
    expand: (matchNode) => {
      const searchNode = matchNode.searchNode
      const nextUrlPart = url[searchNode.urlDepth+1]
      const children = createMatchNodeChildren(matchNode, nextUrlPart, url)
      if (!children.length) matchNode._isTerminal = true
      return children
    },
    leave: (matchNode) => {
      const { searchNode, position } = matchNode
      const isCatchall = position?.type === 'catchall'
      const isExhausted = !url[searchNode.urlDepth+1] // if urlPart is undefined it means it's exhausted

      // A catchall swallows everything remaining the moment it's reached -
      // no exhaustion check to run, it either has a page to accept or it
      // doesn't. Every other node only accepts once the url is exhausted.
      if ((isCatchall || isExhausted) && searchNode.page) {
        winner = matchNode
        winnerPage = { type: 'page', node: searchNode.page }
        return true
      }
      // store match node as candidate if terminal (farthest possible match)
      else if (matchNode._isTerminal) {
        if (!bestStatic || searchNode.staticness > bestStatic.searchNode.staticness)
          bestStatic = matchNode
      }
      // else, try another branch in the parent (all children were visited but no winner)
    },
  })

  if (winner && winnerPage)
    return { node: winner, page: winnerPage }

  const node = bestStatic! // guaranteed since url or tree eventually exhausts (safe to assert)
  const defaultNode = findDefaultRouteNodeParent(node.searchNode.anchor)
  return { node, page: { type: 'default', node: defaultNode } }
}

/** Walks up the winning path, finds slots on each node, creates their
 *  match paths, and attaches them to the corresponding node. */
export function createMatchPath(searchTree: SearchNode, url: string[]): Match {
  const match = createMainMatchPath(searchTree, url)

  for (let node: MatchNode | undefined = match.node; node; node = node.position?.parent) {
    if (!node.searchNode.slots) continue

    node.subtrees = dict()
    for (const [slotName, slotSearchTree] of Object.entries(node.searchNode.slots))
      node.subtrees[slotName] = createMainMatchPath(slotSearchTree, url)
  }
  return match
}
