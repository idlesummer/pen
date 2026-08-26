import type { SearchNode } from './search-tree'
import { forEachSearchNode } from './search-tree'

/** Drops each node's `validation` candidates now that validateSearchTree has
 *  had its look - page/catchall are already live, set as each was collected.
 *  Must run after validateSearchTree, same as sanitizeRouteTree after
 *  validateRouteTree. */
export function sanitizeSearchTree(searchTree: SearchNode) {
  forEachSearchNode(searchTree, (searchNode) => {
    searchNode.validation = undefined // cheaper than delete - avoids a hidden-class transition
  })
}
