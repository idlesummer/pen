import type { ModulePaths, ModuleRole } from './route-module'
import type { SegmentType } from './route-segment'
import { basename } from 'node:path'
import { treeify } from '@/lib/treeify'
import { traverse } from '@/lib/traverse'
import { GLOBAL_DEFAULT, GLOBAL_ERROR, MODULE_ROLES } from './route-module'
import { createSegment, isBoundary, isPrivate } from './route-segment'

/** The role a module path belongs to. Sentinels encode their role in the
 *  constant since they are not real files. */
function getModuleRole(fileName: string): ModuleRole {
  if (fileName === GLOBAL_DEFAULT) return 'default'
  if (fileName === GLOBAL_ERROR) return 'error'
  return basename(fileName, '.tsx') as ModuleRole
}

function isModuleFilePath(path: string): boolean {
  const fileName = basename(path)
  const moduleRole = getModuleRole(fileName)
  return fileName.endsWith('.tsx') && MODULE_ROLES.has(moduleRole)
}

/** Narrows a file list down to real route module files (page/layout/loading/error/default). */
function filterModuleFiles(filePaths: readonly string[]): string[] {
  return filePaths.filter(isModuleFilePath)
}

/** The parse tree, with one node per folder in the app directory.
 *
 *  Built once and never mutated. Fallbacks and invalid routes are handled
 *  during compilation. */
export type RouteNode = {
  name: string
  type: SegmentType
  segment: string
  path: string
  modules: ModulePaths
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
  const modulePaths = filterModuleFiles(filePaths)  // Route paths stay '/' regardless of OS

  treeify(routeTree, modulePaths, '/', {
    create: (parentRouteNode, { index, parts, path: filePath }) => {
      const moduleName = parts[index]! // always defined - create only yields existing indices
      if (index === parts.length-1) {  // the last part is the file itself
        parentRouteNode.modules[getModuleRole(moduleName)] = filePath
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
