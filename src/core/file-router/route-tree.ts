// src/core/file-router/route-tree.ts
import { traverseDepthFirst } from '@/lib/traversal'
import type { FileNode } from '@/core/file-router/file-tree'
import { 
  RootIsFileError,
  DuplicateScreenError, 
  DuplicateLayoutError, 
  DuplicateScreenFileError,
} from './errors'

export type RouteNode = {
  url: string             // full URL like '/blog/'
  type: 'page' | 'group'  // binary type: 'page' or 'group'
  segment: string         // directory name like 'blog'
  screen?: string         // path to screen.tsx
  layout?: string         // path to layout.tsx
  children?: RouteNode[]
}

// Constants for route file detection
const EXTENSIONS = ['tsx', 'ts', 'jsx', 'js'] as const
const ROUTE_FILES = ['layout', 'screen'] as const

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
 * @throws {DuplicateLayoutError} If multiple layouts exist in same directory
 * @throws {DuplicateScreenFileError} If multiple screen files exist in same directory
 */
export function buildRouteTree(fileTree: FileNode): RouteNode {
  if (fileTree.children === undefined) 
    throw new RootIsFileError(fileTree.path)

  const root: RouteNode = {
    url: '/',     // Special case: Root node has "/" as url instead of "/app"
    type: 'page',
    segment: '',  // Special case: Root node has empty segment instead of "app"
    children: [],
  }
  
  if (!fileTree.children.length) // Early return if root has no children
    return root

  const routeToFile = new Map([[root, fileTree]]) // map route → file
  const screenRoutes: Record<string, string> = {} // track duplicate screens

  /**
   * Processes a route node during tree traversal.
   * 
   * 1. Detects and assigns route files (layout.tsx, screen.tsx) from filesystem
   * 2. Validates that screen URLs are unique across the entire tree
   */
  function visit(parentRoute: RouteNode) {
    const parentFile = routeToFile.get(parentRoute)!  // Already populated inside expand 
    if (!parentFile.children)                         // Skip if theres no route files to detect
      return  

    // Step 1: Assign route files
    const groupedFiles = groupFiles(parentFile.children, EXTENSIONS, ROUTE_FILES)
    for (const routeFile of ROUTE_FILES) {
      const files = groupedFiles[routeFile] ?? []      
      if (files.length === 1)
        parentRoute[routeFile] = files[0].path
      else if (files.length > 1) {
        const filePaths = files.map(f => f.path)          
        throw (routeFile === 'layout')
          ? new DuplicateLayoutError(parentFile.path, filePaths)
          : new DuplicateScreenFileError(parentFile.path, filePaths)
    }}

    if (!parentRoute.screen)                          // Skip if no screen was assigned
      return
    
    // Step 2: Validate unique screen url
    const existingFile = screenRoutes[parentRoute.url]
    if (existingFile)
      throw new DuplicateScreenError(parentRoute.url, [existingFile, parentFile.path])
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
      const url = isGroup ? parentRoute.url : `${parentRoute.url}${segment}/`
      const type = isGroup ? 'group' : 'page'

      // This route will always have children since we skipped files
      const route: RouteNode = { url, type, segment, children: [] }
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

/**
 * Groups files by their base name (without extension).
 * Only includes files matching the specified extensions and filenames.
 */
function groupFiles(
  files: FileNode[], 
  extensions: readonly string[], 
  filenames: readonly string[],
) {
  const groups: Record<string, FileNode[]> = {}

  for (const file of files) {
    const name = file.name
    if (!name.includes('.'))
      continue

    const dot = name.lastIndexOf('.')
    const ext = name.slice(dot + 1)
    if (!extensions.includes(ext))
      continue

    const base = name.slice(0, dot)
    if (!filenames.includes(base))
      continue

    groups[base] ??= []
    groups[base].push(file)
  }
  return groups
}
