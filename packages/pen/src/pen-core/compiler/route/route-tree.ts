import type { ModulePaths, ModuleRole } from './route-module'
import type { SegmentType } from './route-segment'
import { basename } from 'node:path'
import { treeify } from '@/lib/treeify'
import { traverse } from '@/lib/traverse'
import { GLOBAL_DEFAULT, GLOBAL_ERROR, MODULE_ROLES } from './route-module'
import { createSegment, isBoundary, isDynamicOrCatchall, isPrivate } from './route-segment'

/** The parse tree, with one node per folder in the app directory. */
export type RouteNode = {
  name: string
  type: SegmentType
  segment: string
  path: string
  modules: ModulePaths
  // Derived
  defaultFallback: RouteNode  // this folder's own nearest real default fallback
  paramCount: number        // dynamic/catchall segments from root to here, inclusive
  // Tree
  parent?: RouteNode
  children: RouteNode[]
}

/** The role a module path or a sentinel belongs to. */
function getModuleRole(fileName: string): ModuleRole {
  if (fileName === GLOBAL_DEFAULT) return 'default'
  if (fileName === GLOBAL_ERROR) return 'error'
  return basename(fileName, '.tsx') as ModuleRole
}

/** Checks if a path is a valid route path. */
function isModuleFilePath(path: string): boolean {
  const fileName = basename(path)
  const moduleRole = getModuleRole(fileName)
  return fileName.endsWith('.tsx') && MODULE_ROLES.has(moduleRole)
}

function createRouteNode(name: string, path: string): RouteNode {
  const segment = createSegment(name)
  const route: RouteNode = { name, ...segment, path, modules: {}, children: [], defaultFallback: undefined as never, paramCount: 0 }
  route.defaultFallback = route
  return route
}

/** Builds the route tree; prunes private folders and preserves invalid routes to report it later. */
export function createRouteTree(filePaths: string[]): RouteNode {
  const routeTree = createRouteNode('', '')
  const modulePaths = filePaths.filter(isModuleFilePath)  // Route paths stay '/' regardless of OS

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
  // Compute route properties derived from the tree
  forEach(routeTree, (route) => {
    if (!route.modules.default && !isBoundary(route.type))
      route.defaultFallback = route.parent!.defaultFallback
    route.paramCount = (route.parent?.paramCount ?? 0) + +isDynamicOrCatchall(route.type)
  })
  return routeTree
}

// ── helpers ────────────────────────────────────────────────────────────

/** Visits every route node. */
export function forEach(root: RouteNode, visit: (routeNode: RouteNode) => void) {
  traverse(root, { visit, expand: routeNode => routeNode.children })
}

/** Returns the diagnostic file, falling back to the route path if no module exists. */
export function getRouteSource(routeNode: RouteNode): string {
  return Object.values(routeNode.modules)[0] ?? routeNode.path
}

/** Compact maps a route node and its ancestors using a function. */
export function compactMapAncestors<T>(route: RouteNode, fn: (node: RouteNode) => T | undefined): T[] {
  const values: T[] = []
  // No condition needed since we always stop at a default or boundary
  for (let node = route; ; node = node.parent!) {
    const value = fn(node)
    if (value !== undefined) values.push(value)
    if (isBoundary(node.type)) break
  }
  return values
}
