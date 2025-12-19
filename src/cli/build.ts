// ============================================================================
// Route Tree Builder - File System to Route Structure Converter
// ============================================================================

// Input types - represents your file system structure
import type { FsNode } from './scanner'

// Output types - represents your route structure
// Properties are dynamic based on config.specialFiles
export type RouteNode = {
  name: string
  isGroup?: boolean
  children?: RouteNode[]
  [key: string]: unknown // Dynamic properties like layoutPath, screenPath, etc.
}

// Configuration type
export type RouteConfig = {
  // Map filename pattern to property name
  // e.g., { /layout\.tsx$/: 'layoutPath', /screen\.tsx$/: 'screenPath' }
  specialFiles?: Record<string, string>
  
  // Pattern to detect route groups (directories that don't affect URL)
  // e.g., /^\(.+\)$/ matches (auth), (marketing), etc.
  group?: RegExp
  
  // Pattern to ignore directories during traversal
  // e.g., /^(node_modules|\.git|dist)$/ matches those exact names
  ignore?: RegExp
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Converts a file system tree into a route tree structure
 * 
 * The properties added to each RouteNode depend on the config.specialFiles mapping.
 * All config options use RegExp for consistency.
 * 
 * @param node - The file system node to convert (usually root directory)
 * @param config - Configuration for customizing behavior (required)
 * @returns A route tree structure or null if node is a file
 * 
 * @example
 * const routes = buildRouteTree(fileSystem, EXPO_ROUTER_CONFIG)
 * 
 * @example
 * const routes = buildRouteTree(fileSystem, {
 *   specialFiles: { 
 *     'page\\.tsx$': 'pagePath',
 *     'error\\.tsx$': 'errorPath' 
 *   },
 *   group: /^\[.+\]$/,
 *   ignore: /^(node_modules|\.git)$/
 * })
 */
export function buildRouteTree(node: FsNode, config: RouteConfig): RouteNode | null {
  // Extract config (no defaults)
  const { specialFiles, group, ignore } = config
  
  // Only process directories
  if (node.children) return null
  
  const dir = node as FsNode
  
  // Check if this directory should be ignored
  if (ignore && ignore.test(dir.name))
    return null

  // Create the base route node
  const routeNode: RouteNode = { name: dir.name }

  // Check if this is a route group
  if (group && group.test(dir.name))
    routeNode.isGroup = true
  
  // Collect child routes
  const childRoutes: RouteNode[] = []
  
  // Process all children
  for (const child of dir.children!) {
    if (child.children) {
      // Check if this file matches any special file pattern
      if (!specialFiles)
        continue

      for (const [pattern, propertyName] of Object.entries(specialFiles)) {
        const regex = new RegExp(pattern)
        // Add the file path as a property on the route node
        if (regex.test(child.name)) {
          routeNode[propertyName] = child.path
          break // Only match first pattern
        }
      }
    } 
    // Recursively process subdirectories
    else {
      const childRoute = buildRouteTree(child, config)
      if (childRoute)
        childRoutes.push(childRoute)
    }
  }
  
  // Only add children array if there are actual child routes
  if (childRoutes.length > 0)
    routeNode.children = childRoutes
  
  return routeNode
}
