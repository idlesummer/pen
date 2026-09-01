import type { SearchNode } from '../compiling/search-tree'
import { traverse } from '@/lib/traverse'

type MatchNode = {
  searchNode: SearchNode
  isTerminal?: true
  position?: {
    type: 'static' | 'dynamic'
    segment: string
    segments: string[]
    parent: MatchNode
  }
}

function createMainMatchPath(searchTree: SearchNode, url: string[]) {
  const matchNode: MatchNode = {  }

  traverse(matchNode, {
    expand,
    leave,
  })

  return matchNode
}

/** Walks up the winning path, finds slots on each node, creates their
 *  match paths, and attaches them to the corresponding node. */
export function createMatchPath(searchTree: SearchNode, url: string[]): MatchNode {
  const mainMatchNode = createMatchPath(searchTree, url)

  return mainMatchNode
}
