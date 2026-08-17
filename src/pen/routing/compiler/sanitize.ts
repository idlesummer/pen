import type { RouteNode } from './route-tree.js'
import type { SearchNode } from './search-tree.js'
import { traverse } from '@/lib/traverse.js'
import { forEachSearchNode } from './search-tree.js'
import { findNearestSlotAncestor } from './validate.js'

function shouldKeepRouteChild(childRouteNode: RouteNode, isInsideSlot: boolean): boolean {
  const isMalformed = childRouteNode.segment.type === 'malformed'
  const isNestedSlot = isInsideSlot && childRouteNode.segment.type === 'slot'
  return !isMalformed && !isNestedSlot
}

/** Clears a catch-all's children (nothing can nest under one), drops
 *  malformed children outright, and prunes slots nested inside another
 *  slot's subtree (both flagged by validateRouteTree) - before expand
 *  descends further. */
export function sanitizeRouteTree(routeTree: RouteNode) {
  traverse(routeTree, {
    visit: (routeNode) => {
      const isInsideSlot = routeNode.segment.type === 'slot' || !!findNearestSlotAncestor(routeNode)
      routeNode.children = routeNode.segment.type !== 'catchall'
        ? routeNode.children.filter(child => shouldKeepRouteChild(child, isInsideSlot))
        : []
    },
    expand: (routeNode) =>
      routeNode.children,
  })
}

/** Collapses each node's validated candidates down to the single value
 *  matching reads, then drops `validation` entirely. Must run after
 *  validateSearchTree, same as sanitizeRouteTree after validateRouteTree. */
export function sanitizeSearchTree(searchTree: SearchNode) {
  forEachSearchNode(searchTree, (searchNode) => {
    const [pageRouteNode] = searchNode.validation?.pages ?? []
    const [catchallRouteNode] = searchNode.validation?.catchalls ?? []
    searchNode.page = pageRouteNode
    searchNode.catchall = catchallRouteNode
    delete searchNode.validation
  })
}
