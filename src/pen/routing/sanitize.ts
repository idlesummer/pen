// Strips dead branches from a RouteNode tree, and validation-only
// bookkeeping from a SearchNode tree - must run after validate reads the
// raw evidence, since that's the only point it still exists.

import type { RouteNode } from './route-tree.js'
import type { SearchNode } from './search-tree.js'
import { traverse } from '@/lib/traverse.js'
import { forEachSearchNode } from './search-tree.js'
import { findNearestSlotAncestor } from './validate.js'

/** Clears a catch-all's children (nothing can nest under one), drops
 *  malformed children outright, and prunes slots nested inside another
 *  slot's subtree (both flagged by validateRouteTree) - before expand
 *  descends further. */
export function sanitizeRouteTree(routeTree: RouteNode) {
  traverse(routeTree, {
    visit: (routeNode) => {
      const insideSlot = routeNode.segment.type === 'slot' || !!findNearestSlotAncestor(routeNode)
      routeNode.children = routeNode.segment.type !== 'catchall'
        ? routeNode.children.filter(child => child.segment.type !== 'malformed' && !(insideSlot && child.segment.type === 'slot'))
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
