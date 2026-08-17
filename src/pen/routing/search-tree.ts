import type { RouteNode } from './route-tree.js'
import { traverse } from '@/lib/traverse.js'

export type SearchNode = {
  routeNode: RouteNode                // real folder for this position - not-found climbs from here
  index: number                       // url index this position corresponds to
  specificity: number                 // how static-preferring the path to this node is; higher is better
  // Accepting route nodes
  page?: RouteNode                    // checked by classifyMatchPath to decide if this position is a match
  catchall?: RouteNode                // consuming folder's catch-all page
  // Route types
  statics?: Map<string, SearchNode>   // consuming folder's static children
  dynamic?: SearchNode                // consuming folder's dynamic child - param name is getParam(dynamic)
  slots?: Map<string, SearchNode>     // this position's own named slots, if its real folder has any @name children
  // Validation metadata
  validation?: {                      // candidates validation checks against (later removed in sanitizeSearchTree)
    pages?: RouteNode[]               // every page claimed here, for duplicate-route
    dynamics?: Map<string, RouteNode> // every dynamic name claimed here -> the route that claimed it, for param-name-clash
    catchalls?: RouteNode[]           // every catch-all claimed here, for duplicate-route
  }
}

function createSearchNode(routeNode: RouteNode, index: number, specificity: number): SearchNode {
  return { routeNode, index, specificity, validation: {} }  // Validation is guaranteed to exist here, it's only removed later at sanitization
}

function collectAcceptingRouteNodes(searchNode: SearchNode, routeNode: RouteNode) {
  if (routeNode.segment.type === 'catchall')
    (searchNode.validation!.catchalls ??= []).push(routeNode)
  else
    (searchNode.validation!.pages ??= []).push(routeNode)
}

function getOrCreateStaticChild(parentSearchNode: SearchNode, childRouteNode: RouteNode): SearchNode {
  const staticSearchNodes = parentSearchNode.statics ??= new Map()
  const staticChildName = childRouteNode.segment.value
  const createStaticChild = () => createSearchNode(childRouteNode, parentSearchNode.index+1, parentSearchNode.specificity)
  return staticSearchNodes.getOrInsertComputed(staticChildName, createStaticChild)  // return the static child
}

function getOrCreateDynamicChild(parentSearchNode: SearchNode, childRouteNode: RouteNode): SearchNode {
  const dynamicSearchNode = parentSearchNode.dynamic ??= createSearchNode(childRouteNode, parentSearchNode.index+1, parentSearchNode.specificity-1)
  const dynamicChildName = childRouteNode.segment.value
  parentSearchNode.validation!.dynamics ??= new Map()                                 // for validation
  parentSearchNode.validation!.dynamics.getOrInsert(dynamicChildName, childRouteNode) // for validation
  return dynamicSearchNode
}

function getOrCreateSlotChild(parentSearchNode: SearchNode, childRouteNode: RouteNode): SearchNode {
  const slotSearchNodes = parentSearchNode.slots ??= new Map() // slot can't consume url, so it inherits owner's index and specificity
  const slotChildName = childRouteNode.segment.value
  const createSlotChild = () => createSearchNode(childRouteNode, parentSearchNode.index, parentSearchNode.specificity)
  return slotSearchNodes.getOrInsertComputed(slotChildName, createSlotChild) // return the slot child
}

function inheritOrCreateSearchNode(parentSearchNode: SearchNode, childRouteNode: RouteNode): SearchNode {
  switch (childRouteNode.segment.type) {
    default:        return parentSearchNode // inherits parents parent search node if catchall, group, malformed
    case 'static':  return getOrCreateStaticChild(parentSearchNode, childRouteNode)   // creates search node otherwise
    case 'dynamic': return getOrCreateDynamicChild(parentSearchNode, childRouteNode)
    case 'slot':    return getOrCreateSlotChild(parentSearchNode, childRouteNode)
  }
}

/** Creates the search tree from a route tree and populates each search node
 *  with its associated modules and validation data. */
export function createSearchTree(routeTree: RouteNode): SearchNode {
  const searchTree = createSearchNode(routeTree, 0, 0)
  const searchNodeMap = new Map([[routeTree, searchTree]])  // temp map to hold routenode to searchnode pairs

  traverse(routeTree, {
    visit: (routeNode) => { // visit adds its accepting-route data to it.
      if (!routeNode.modulePaths.has('page')) return
      const searchNode = searchNodeMap.get(routeNode)!
      collectAcceptingRouteNodes(searchNode, routeNode)
    },
    expand: (routeNode) => routeNode.children,
    attach: (childRouteNode, parentRouteNode) => {  // attach creates each child's search node in the map
      const parentSearchNode = searchNodeMap.get(parentRouteNode)!
      searchNodeMap.set(childRouteNode, inheritOrCreateSearchNode(parentSearchNode, childRouteNode))
    },
  })
  return searchTree
}

export function getDynamicParam(dynamicSearchNode: SearchNode): string {
  return dynamicSearchNode.routeNode.segment.value
}

export function forEachSearchNode(searchTree: SearchNode, visit: (searchNode: SearchNode) => void) {
  traverse(searchTree, {
    visit,
    expand: (searchNode) => {
      const children = searchNode.statics ? [...searchNode.statics.values()] : []
      if (searchNode.dynamic) children.push(searchNode.dynamic)
      if (searchNode.slots)   children.push(...searchNode.slots.values())
      return children
    },
  })
}
