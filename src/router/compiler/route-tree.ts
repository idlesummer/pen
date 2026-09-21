import type { RouteModulePaths } from './route-module'
import type { SegmentType } from './route-segment'
import { treeify } from '@/lib/treeify'
import { traverse } from '@/lib/traverse'
import { filterRouteFiles, getRouteModuleRole } from './route-module'
import { createSegment, isBoundary, isPrivate } from './route-segment'

/** The parse: one node per folder, mirroring the app directory.
 *
 *  Built once and never mutated. Two passes that used to run here are gone:
 *  the `default` fallback injection, which is a routing guarantee and now lives
 *  next to the fallback that needs it, and the pruning of invalid routes, which
 *  is now a skip rule in the position-tree walk. Immutability is what removes the
 *  ordering constraint between validating and compiling - they can run in
 *  either order, or not at all, without changing the result. */
export type RouteNode = {
  name: string
  type: SegmentType
  segment: string
  path: string
  modules: RouteModulePaths
  // Tree
  parent?: RouteNode
  children: RouteNode[]
}

function createRouteNode(name: string, path: string): RouteNode {
  return { name, ...createSegment(name), path, modules: {}, children: [] }
}

/** Visits every route node. */
export function forEach(root: RouteNode, visit: (routeNode: RouteNode) => void) {
  traverse(root, { visit, expand: routeNode => routeNode.children })
}

/** Builds the route tree from a file list. Private folders (`_lib`) are erased
 *  here, since they are not routing at all; everything else is kept verbatim,
 *  including illegal names - reporting those needs the folder to still exist. */
export function createRouteTree(filePaths: string[]): RouteNode {
  const routeTree = createRouteNode('', '')

  // Always '/', never node:path's sep - these are route paths, not OS file
  // paths, and stay forward-slash on every platform regardless of host OS.
  treeify(routeTree, filterRouteFiles(filePaths), '/', {
    create: (parentRouteNode, { index, parts, path: filePath }) => {
      const moduleName = parts[index]! // always defined - create only yields existing indices
      if (index === parts.length-1) {  // the last part is the file itself
        parentRouteNode.modules[getRouteModuleRole(moduleName)] = filePath
        return
      }
      if (isPrivate(moduleName)) return // prunes the rest of this path

      const path = parentRouteNode.path ? `${parentRouteNode.path}/${moduleName}` : moduleName
      return createRouteNode(moduleName, path)
    },
    attach: (child, parent) => {
      child.parent = parent
      parent.children.push(child)
    },
  })
  return routeTree
}

/** The file a diagnostic should point at - a folder the user can go open.
 *  Falls back to the route path for a folder that owns no module of its own. */
export function getRouteSource(routeNode: RouteNode): string {
  return Object.values(routeNode.modules)[0] ?? routeNode.path
}

/** This folder's own nearest real default - itself, if it declares one or is
 *  a boundary, otherwise the nearest ancestor that does. */
export function findDefaultOwner(route: RouteNode): RouteNode {
  for (let node = route; ; node = node.parent!) {
    if (node.modules.default || isBoundary(node.type))
      return node
  }
}

/** Maps a folder and each ancestor routing inherits from, root-ward, keeping
 *  only the defined results - the walk an endpoint's frame chain is built
 *  from, and the render stage would otherwise repeat on every navigation. */
export function compactMapAncestors<T>(route: RouteNode, fn: (node: RouteNode) => T | undefined): T[] {
  const values: T[] = []
  // No condition needed since we always stop at a default or boundary
  for (let node = route; ; node = node.parent!) {
    const value = fn(node)
    if (value !== undefined)   values.push(value)
    if (isBoundary(node.type)) break
  }
  return values
}
