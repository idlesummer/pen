import type { RouteNode } from './route-tree.js'
import type { SearchNode } from './search-tree.js'
import { traverse } from '@/lib/traverse.js'
import { getSlotAncestor } from './route-tree.js'
import { forEachSearchNode } from './search-tree.js'

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

/** Drops each node's `validation` candidates now that validateSearchTree has
 *  had its look - page/catchall are already live, set as each was collected.
 *  Must run after validateSearchTree, same as sanitizeRouteTree after
 *  validateRouteTree. */
export function sanitizeSearchTree(searchTree: SearchNode) {
  forEachSearchNode(searchTree, (searchNode) => {
    searchNode.validation = undefined // cheaper than delete - avoids a hidden-class transition
  })
}
