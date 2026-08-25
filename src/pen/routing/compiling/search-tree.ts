import type { RouteNode } from './route-tree'
import { traverse } from '@/lib/traverse'

export type SearchNode = {
  anchor: RouteNode                   // means nearest ancestor/self whose segment is static/dynamic/slot
  urlDepth: number                    // segments consumed to reach this position - 0 at root
  staticness: number                  // how static-preferring the path to this node is; higher is better
  // Accepting route nodes
  page?: RouteNode                    // checked during matching to decide if this position is a match
  catchall?: RouteNode                // consuming folder's catch-all page
  // Route types
  slots?: Map<string, SearchNode>     // this position's own named slots, if its real folder has any @name children
  statics?: Map<string, SearchNode>   // consuming folder's static children
  dynamic?: SearchNode                // consuming folder's dynamic child - param name is dynamic.anchor.segment.value
  // Validation metadata
  validation?: {                      // candidates validation checks against (later removed in sanitizeSearchTree)
    pages?: RouteNode[]               // every page claimed here, for duplicate-route
    dynamics?: Map<string, RouteNode> // every dynamic name claimed here -> the route that claimed it, for param-name-clash
    catchalls?: RouteNode[]           // every catch-all claimed here, for duplicate-route
  }
}

function createSearchNode(anchor: RouteNode, urlDepth: number, staticness: number): SearchNode {
  return { anchor, urlDepth, staticness, validation: {} }  // Validation is guaranteed to exist here, it's only removed later at sanitization
}

function collectAcceptingRouteNodes(searchNode: SearchNode, routeNode: RouteNode) {
  const validation = searchNode.validation!
  const segmentType = routeNode.segment.type
  const routeNodes = segmentType === 'catchall' ? (validation.catchalls ??= []) : (validation.pages ??= [])
  routeNodes.push(routeNode)

  // first claimant wins - same node validateSearchTree will flag as a duplicate if routeNodes.length > 1
  if (segmentType === 'catchall') searchNode.catchall ??= routeNode
  else searchNode.page ??= routeNode
}

function getOrCreateStaticChild(parentSearchNode: SearchNode, childRouteNode: RouteNode): SearchNode {
  const { urlDepth, staticness } = parentSearchNode
  const staticSearchNodes = parentSearchNode.statics ??= new Map()
  const staticChildName = childRouteNode.segment.value
  const createStaticChild = () => createSearchNode(childRouteNode, urlDepth+1, staticness)
  return staticSearchNodes.getOrInsertComputed(staticChildName, createStaticChild)  // return the static child
}

function getOrCreateDynamicChild(parentSearchNode: SearchNode, childRouteNode: RouteNode): SearchNode {
  const { urlDepth, staticness } = parentSearchNode
  const dynamicSearchNode = parentSearchNode.dynamic ??= createSearchNode(childRouteNode, urlDepth+1, staticness-1)
  const dynamicChildName = childRouteNode.segment.value
  const validationDynamics = parentSearchNode.validation!.dynamics ??= new Map()
  validationDynamics.getOrInsert(dynamicChildName, childRouteNode) // for validation
  return dynamicSearchNode
}

function getOrCreateSlotChild(parentSearchNode: SearchNode, childRouteNode: RouteNode): SearchNode {
  const { urlDepth, staticness } = parentSearchNode
  const slotSearchNodes = parentSearchNode.slots ??= new Map() // slot can't consume url, so it inherits owner's urlDepth and staticness
  const slotChildName = childRouteNode.segment.value
  const createSlotChild = () => createSearchNode(childRouteNode, urlDepth, staticness)
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
      if (!routeNode.modulePaths.page) return
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
