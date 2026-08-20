import type { RouteNode } from './route-tree'
import { traverse } from '@/lib/traverse'

/* anchor: static/dynamic/slot folders each get their own SearchNode; group/
 * catchall/malformed folders are transparent and share their parent's.
 *
 *   blog/                     <- anchor (static)
 *   └── (reviews)/            <- NOT anchor (group)
 *       └── (critics)/        <- NOT anchor (group)
 *           ├── featured/     <- anchor (static)
 *           │   └── page.tsx
 *           └── archive/      <- anchor (static)
 *               └── page.tsx
 *
 * Both featured and archive anchor to themselves; (reviews) and (critics)
 * anchor to blog, the nearest real folder before the group chain began. */
export type SearchNode = {
  anchor: RouteNode                   // means nearest ancestor/self whose segment is static/dynamic/slot
  depth: number                       // segments consumed to reach this position - 0 at root
  specificity: number                 // how static-preferring the path to this node is; higher is better
  // Accepting route nodes
  page?: RouteNode                    // checked by classifyMatchPath to decide if this position is a match
  catchall?: RouteNode                // consuming folder's catch-all page
  // Route types
  statics?: Map<string, SearchNode>   // consuming folder's static children
  dynamic?: SearchNode                // consuming folder's dynamic child - param name is getDynamicParamName(dynamic)
  slots?: Map<string, SearchNode>     // this position's own named slots, if its real folder has any @name children
  // Validation metadata
  validation?: {                      // candidates validation checks against (later removed in sanitizeSearchTree)
    pages?: RouteNode[]               // every page claimed here, for duplicate-route
    dynamics?: Map<string, RouteNode> // every dynamic name claimed here -> the route that claimed it, for param-name-clash
    catchalls?: RouteNode[]           // every catch-all claimed here, for duplicate-route
  }
}

function createSearchNode(anchor: RouteNode, depth: number, specificity: number): SearchNode {
  return { anchor, depth, specificity, validation: {} }  // Validation is guaranteed to exist here, it's only removed later at sanitization
}

function collectAcceptingRouteNodes(searchNode: SearchNode, routeNode: RouteNode) {
  const validation = searchNode.validation!
  const segmentType = routeNode.segment.type
  const routeNodes = segmentType === 'catchall' ? (validation.catchalls ??= []) : (validation.pages ??= [])
  routeNodes.push(routeNode)
}

function getOrCreateStaticChild(parentSearchNode: SearchNode, childRouteNode: RouteNode): SearchNode {
  const staticSearchNodes = parentSearchNode.statics ??= new Map()
  const staticChildName = childRouteNode.segment.value
  const createStaticChild = () => createSearchNode(childRouteNode, parentSearchNode.depth+1, parentSearchNode.specificity)
  return staticSearchNodes.getOrInsertComputed(staticChildName, createStaticChild)  // return the static child
}

function getOrCreateDynamicChild(parentSearchNode: SearchNode, childRouteNode: RouteNode): SearchNode {
  const dynamicSearchNode = parentSearchNode.dynamic ??= createSearchNode(childRouteNode, parentSearchNode.depth+1, parentSearchNode.specificity-1)
  const dynamicChildName = childRouteNode.segment.value
  parentSearchNode.validation!.dynamics ??= new Map()                                 // for validation
  parentSearchNode.validation!.dynamics.getOrInsert(dynamicChildName, childRouteNode) // for validation
  return dynamicSearchNode
}

function getOrCreateSlotChild(parentSearchNode: SearchNode, childRouteNode: RouteNode): SearchNode {
  const slotSearchNodes = parentSearchNode.slots ??= new Map() // slot can't consume url, so it inherits owner's depth and specificity
  const slotChildName = childRouteNode.segment.value
  const createSlotChild = () => createSearchNode(childRouteNode, parentSearchNode.depth, parentSearchNode.specificity)
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

export function getDynamicParamName(dynamicSearchNode: SearchNode): string {
  return dynamicSearchNode.anchor.segment.value
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
