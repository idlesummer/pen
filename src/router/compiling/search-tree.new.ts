import type { RouteNode } from './route-tree'
import { dict } from '@/lib/dict'
import { traverse } from '@/lib/traverse'
import { findDefaultAncestor } from './route-tree'
import { isDynamicOrCatchall, isUrlConsuming } from './segment'

export type SearchNode = {
  anchor: RouteNode                    // means nearest ancestor/self whose segment is static/dynamic/slot/catchall
  urlDepth: number                     // segments consumed to reach this position - 0 at root; a matching-walk concept, not a route-tree fact
  staticness: number                   // how static-preferring the path to this node is; higher is better - same reasoning as urlDepth
  default: RouteNode                   // nearest default-bearing route above (or at) anchor - only computed for nodes that get a SearchNode
  // Accepting route nodes
  page?: RouteNode                     // checked during matching to decide if this position is a match
  // Route types
  slots?: Record<string, SearchNode>   // this position's own named slots, if its real folder has any @name children
  statics?: Record<string, SearchNode> // consuming folder's static children
  dynamic?: SearchNode                 // consuming folder's dynamic child - param name is dynamic.anchor.segment.value
  catchall?: SearchNode                // consuming folder's catch-all child
  // Validation metadata
  validation?: {                         // candidates validation checks against (later removed in sanitizeSearchTree)
    pages?: RouteNode[]                  // every page claimed here, for duplicate-route
    dynamics?: Record<string, RouteNode> // every dynamic name claimed here -> the route that claimed it, for param-name-clash
    catchalls?: RouteNode[]              // every catch-all child claimed here, for duplicate-route
  }
}

function createSearchNode(anchor: RouteNode, parent?: SearchNode): SearchNode {
  const urlDepth = (parent?.urlDepth ?? 0) + +isUrlConsuming(anchor.segment)
  const staticness = (parent?.staticness ?? 0) - +isDynamicOrCatchall(anchor.segment)
  const defaultNode = findDefaultAncestor(anchor)
  return { anchor, urlDepth, staticness, default: defaultNode, validation: {} } // Validation is guaranteed to exist here, it's only removed later at sanitization
}

function getOrCreateSearchNode(parentSearchNode: SearchNode, childRouteNode: RouteNode): SearchNode {
  const segment = childRouteNode.segment

  switch (segment.type) {
    default:
      return parentSearchNode // inherits parents parent search node if group/malformed

    case 'static':
      return (parentSearchNode.statics ??= dict())[segment.value] ??= createSearchNode(childRouteNode, parentSearchNode)

    case 'dynamic':
      (parentSearchNode.validation!.dynamics ??= dict())[segment.value] ??= childRouteNode // for validation
      return parentSearchNode.dynamic ??= createSearchNode(childRouteNode, parentSearchNode)

    case 'catchall':
      (parentSearchNode.validation!.catchalls ??= []).push(childRouteNode) // for duplicate-route validation
      return parentSearchNode.catchall ??= createSearchNode(childRouteNode, parentSearchNode)

    case 'slot':  // slots can't consume url
      return (parentSearchNode.slots ??= dict())[segment.value] ??= createSearchNode(childRouteNode, parentSearchNode)
  }
}

/** Creates the search tree from a route tree and populates each search node
 *  with its associated modules and validation data. */
export function createSearchTree(routeTree: RouteNode): SearchNode {
  const searchTree = createSearchNode(routeTree)
  const searchNodeMap = new Map([[routeTree, searchTree]]) // temp map to hold routenode to searchnode pairs

  traverse(routeTree, {
    visit: (routeNode) => { // visit adds its accepting-route data to it.
      if (!routeNode.modules.page) return
      const searchNode = searchNodeMap.get(routeNode)!
      searchNode.page ??= routeNode;
      (searchNode.validation!.pages ??= []).push(routeNode)
    },
    expand: (routeNode) => routeNode.children,
    attach: (childRouteNode, parentRouteNode) => { // attach creates each child's search node in the map
      const parentSearchNode = searchNodeMap.get(parentRouteNode)!
      const childSearchNode = getOrCreateSearchNode(parentSearchNode, childRouteNode)
      searchNodeMap.set(childRouteNode, childSearchNode)
    },
  })
  return searchTree
}

export function forEach(searchTree: SearchNode, visit: (searchNode: SearchNode) => void) {
  traverse(searchTree, {
    visit,
    expand: (searchNode) => {
      const children = searchNode.statics ? Object.values(searchNode.statics) : []
      if (searchNode.dynamic)  children.push(searchNode.dynamic)
      if (searchNode.catchall) children.push(searchNode.catchall)
      if (searchNode.slots)    children.push(...Object.values(searchNode.slots))
      return children
    },
  })
}
