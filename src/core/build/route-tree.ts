import { traverseDepthFirst } from '@/core/lib/traversal'
import type { FileNode } from '@/core/build/file-tree'

export type RouteNode = {
  url: string             // full URL like '/blog/'
  type: 'page' | 'group'  // binary type: 'page' or 'group'
  segment: string         // directory name like 'blog'
  screen?: string         // path to screen.tsx
  layout?: string         // path to layout.tsx
  children?: RouteNode[]
}

/**
 * Builds a route tree from a file system tree.
 * 
 * Detects layout and screen files, computes URLs, filters private directories,
 * and validates no duplicate screens at the same URL.
 */
export function buildRouteTree(fileTree: FileNode): RouteNode | null {
  if (!fileTree.children) 
    return null

  const root: RouteNode = {
    url: '/',
    type: 'page', 
    segment: fileTree.name,
    children: [],
  }
  const routeToFile = new Map([[root, fileTree]]) // map route → file
  const screenRoutes: Record<string, string> = {} // track duplicate screens
  
  // Constants for route file detection
  const EXTENSIONS = ['tsx', 'ts', 'jsx', 'js'] as const  // Supported file extensions
  const ROUTE_FILES = ['layout', 'screen'] as const       // Route files to detect

  function visit(parentRoute: RouteNode) {
    const parentFile = routeToFile.get(parentRoute)!  // Already populated inside expand

    // Assign route files
    if (parentFile.children) {
      const groupedFiles = groupFiles(parentFile.children, EXTENSIONS, ROUTE_FILES)

      for (const routeFile of ROUTE_FILES) {
        const files = groupedFiles[routeFile] ?? []
        if (files.length === 1)
          parentRoute[routeFile] = files[0].path

        else if (files.length > 1) {
          const fileList = files.map(f => `  - ${f.path}`).join('\n')
          throw Error(
            `Conflicting ${routeFile} files found in "${parentFile.path}":\n` +
            `${fileList}\n\n` +
            `Only one ${routeFile} file is allowed per directory.\n` +
            'Keep one file and remove the others.')
        }
      }
    }

    // Validate unique screen url
    if (parentRoute.screen) {
      const existingFile = screenRoutes[parentRoute.url]
      if (existingFile) {
        throw Error(
          `Conflicting screen routes found at "${parentRoute.url}":\n` +
          `  - ${existingFile}\n` +
          `  - ${parentFile.path}\n\n` +
          'Each URL can only have one screen file.\n' +
          'Move one screen to a different directory or rename the route segment.')
      }
      screenRoutes[parentRoute.url] = parentFile.path
    }
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
