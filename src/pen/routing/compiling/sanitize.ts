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
      const segmentType = routeNode.segment.type
      const isInsideSlot = segmentType === 'slot' || !!findNearestSlotAncestor(routeNode)
      routeNode.children = segmentType !== 'catchall'
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
    const pageRouteNode = searchNode.validation?.pages?.[0]
    const catchallRouteNode = searchNode.validation?.catchalls?.[0]
    if (pageRouteNode)     searchNode.page = pageRouteNode
    if (catchallRouteNode) searchNode.catchall = catchallRouteNode
    delete searchNode.validation
  })
}
