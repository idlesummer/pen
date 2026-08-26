import type { RouteNode } from './route-tree'
import { traverse } from '@/lib/traverse'
import { getSlotAncestor } from './route-tree'

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
      const isInsideSlot = segmentType === 'slot' || !!getSlotAncestor(routeNode)
      routeNode.children = segmentType !== 'catchall'
        ? routeNode.children.filter(child => shouldKeepRouteChild(child, isInsideSlot))
        : []
    },
    expand: (routeNode) =>
      routeNode.children,
  })
}
