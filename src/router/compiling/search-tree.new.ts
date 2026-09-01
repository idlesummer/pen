import type { RouteNode } from './route-tree'
import { dict } from '@/lib/dict'
import { traverse } from '@/lib/traverse'

// Exploratory variant of search-tree.ts: promotes catch-all from a bare
// RouteNode reference stashed on its parent into a first-class SearchNode
// of its own, symmetric with static/dynamic/slot. Not wired into
// match-tree.ts or any other downstream consumer yet - this only changes
// the shape of the search tree itself.

export type SearchNode = {
  anchor: RouteNode                    // means nearest ancestor/self whose segment is static/dynamic/slot/catchall
  urlDepth: number                     // segments consumed to reach this position - 0 at root
  staticness: number                   // how static-preferring the path to this node is; higher is better
  // Accepting route nodes
  page?: RouteNode                     // checked during matching to decide if this position is a match
  // Route types
  slots?: Record<string, SearchNode>   // this position's own named slots, if its real folder has any @name children
  statics?: Record<string, SearchNode> // consuming folder's static children
  dynamic?: SearchNode                 // consuming folder's dynamic child - param name is dynamic.anchor.segment.value
  catchall?: SearchNode                // consuming folder's catch-all child, promoted to a real position - meant to be last, same as before this change
  // Validation metadata
  validation?: {                      // candidates validation checks against (later removed in sanitizeSearchTree)
    pages?: RouteNode[]               // every page claimed here, for duplicate-route
    dynamics?: Map<string, RouteNode> // every dynamic name claimed here -> the route that claimed it, for param-name-clash
    catchalls?: RouteNode[]           // every catch-all child claimed here, for duplicate-route
  }
}

function addAcceptingRouteNode(searchNode: SearchNode, routeNode: RouteNode) {
  // No more branching on segment.type here - by the time visit() reaches a
  // routeNode with its own modulePaths.page, searchNodeMap already resolves
  // it to the SearchNode that's actually its own (catch-all included), so
  // every accepting node is uniformly "this position's own page" now.
  (searchNode.validation!.pages ??= []).push(routeNode)
  searchNode.page ??= routeNode
}

function createSearchNode(anchor: RouteNode, urlDepth: number, staticness: number): SearchNode {
  return { anchor, urlDepth, staticness, validation: {} } // Validation is guaranteed to exist here, it's only removed later at sanitization
}

function getOrCreateSearchNode(parentSearchNode: SearchNode, childRouteNode: RouteNode): SearchNode {
  const { urlDepth, staticness } = parentSearchNode
  const segment = childRouteNode.segment

  switch (segment.type) {
    default:
      return parentSearchNode // inherits parents parent search node if group/malformed

    case 'static': {
      const createStatic = () => createSearchNode(childRouteNode, urlDepth+1, staticness)
      return (parentSearchNode.statics ??= dict())[segment.value] ??= createStatic()
    }
    case 'dynamic': {
      (parentSearchNode.validation!.dynamics ??= new Map()).getOrInsert(segment.value, childRouteNode) // for validation
      return parentSearchNode.dynamic ??= createSearchNode(childRouteNode, urlDepth+1, staticness-1)
    }
    case 'catchall': {
      (parentSearchNode.validation!.catchalls ??= []).push(childRouteNode) // for duplicate-route validation
      return parentSearchNode.catchall ??= createSearchNode(childRouteNode, urlDepth+1, staticness-1)
    }
    case 'slot': {  // slot can't consume url, so it inherits owner's urlDepth and staticness
      const createSlotNode = () => createSearchNode(childRouteNode, urlDepth, staticness)
      return (parentSearchNode.slots ??= dict())[segment.value] ??= createSlotNode()
    }
  }
}

/** Creates the search tree from a route tree and populates each search node
 *  with its associated modules and validation data. */
export function createSearchTree(routeTree: RouteNode): SearchNode {
  const searchTree = createSearchNode(routeTree, 0, 0)
  const searchNodeMap = new Map([[routeTree, searchTree]]) // temp map to hold routenode to searchnode pairs

  traverse(routeTree, {
    visit: (routeNode) => { // visit adds its accepting-route data to it.
      if (!routeNode.modulePaths.page) return
      const searchNode = searchNodeMap.get(routeNode)!
      addAcceptingRouteNode(searchNode, routeNode)
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

export function forEachSearchNode(searchTree: SearchNode, visit: (searchNode: SearchNode) => void) {
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
