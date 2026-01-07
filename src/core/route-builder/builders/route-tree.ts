import { parse } from 'path'
import { traverseDepthFirst } from '@/lib/traversal'
import { RootIsFileError, DuplicateScreenError } from '../errors'
import { type FileNode } from './file-tree'

export type RouteRole = typeof ROUTE_ROLES[number]
export type RouteRoles = Partial<Record<RouteRole, string>>
export type RouteNode = {
  url: string             // full URL like '/blog/'
  type: 'page' | 'group'  // binary type: 'page' or 'group'
  segment: string         // directory name like 'blog'
  roles: RouteRoles
  children?: RouteNode[]
}

// Constants for routes
export const ROUTE_EXTENSION = '.tsx' as const
export const ROUTE_ROLES = ['layout', 'screen', 'error', 'not-found'] as const

/**
 * Builds a route tree from a file system tree.
 *
 * Detects layout and screen files, computes URLs, filters private directories,
 * and validates no duplicate screens at the same URL.
 *
 * @param fileTree - File system tree
 * @returns Route tree with computed URLs and validated structure
 * @throws {RootIsFileError} If the root is a file instead of a directory
 * @throws {DuplicateScreenError} If multiple screens map to the same URL
 */
export function buildRouteTree(fileTree: FileNode): RouteNode {
  if (fileTree.children === undefined)
    throw new RootIsFileError(fileTree.path)

  // Special case: Root has "/" as url instead of "/app",
  // and empty segment instead of "app"
  const root: RouteNode = {
    url: '/',
    type: 'page',
    segment: '',
    roles: {},
    children: [],
  }

  if (!fileTree.children.length) // Early return if root has no children
    return root

  const routeToFile = new Map([[root, fileTree]]) // map route → file
  const screenRoutes: Record<string, string> = {} // track duplicate screens

  function visit(parentRoute: RouteNode) {
    const parentFile = routeToFile.get(parentRoute)!  // Already populated inside expand
    if (!parentFile.children?.length) return

    // Step 1: Assign route role files
    for (const file of parentFile.children) {
      if (!file.name.endsWith(ROUTE_EXTENSION)) // Skip non .tsx files
        continue

      const { name } = parse(file.name) // Skip files that arent route roles
      if (!isRouteRole(name))
        continue
      parentRoute.roles[name] = file.path
    }

    // Step 2: Validate that screen URLs are unique across the entire tree
    if (!parentRoute.roles.screen)
      return

    const existingFilePath = screenRoutes[parentRoute.url]
    if (existingFilePath)
      throw new DuplicateScreenError(parentRoute.url, [existingFilePath, parentFile.path])

    screenRoutes[parentRoute.url] = parentFile.path
  }

  function expand(parentRoute: RouteNode) {
    const parentFile = routeToFile.get(parentRoute)!
    if (!parentFile.children) return          // Skip expand if route has no children
    const routes: RouteNode[] = []            // Create container for route children

    for (const file of parentFile.children) {
      if (!file.children) continue            // Skip if file
      if (file.name.startsWith('_')) continue // Skip if private directory
      const segment = file.name
      const isGroup = segment.startsWith('(') && segment.endsWith(')')
      const url  = isGroup ? parentRoute.url : `${parentRoute.url}${segment}/`
      const type = isGroup ? 'group' : 'page'

      // This route will always have children since we skipped files
      const route: RouteNode = { url, type, segment, roles: {}, children: [] }
      routeToFile.set(route, file)
      routes.push(route)
    }
    return routes.sort((a, b) => a.segment.localeCompare(b.segment))
  }

  function attach(child: RouteNode, parent: RouteNode) {
    parent.children!.push(child)
  }

  return traverseDepthFirst({ root, visit, expand, attach })
}

function isRouteRole(name: string): name is RouteRole {
  return (ROUTE_ROLES as readonly string[]).includes(name)
}
