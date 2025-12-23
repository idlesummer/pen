import { traverseDepthFirst } from '@/lib/tree'
import type { RouteNode } from '@/routing/route-tree'

export type RouteMetadata = {
  path: string      // URL path: '/', '/about', '/blog',  
  segment: string   // Last segment: 'app', 'about', 'blog
  layouts: string[] // Inherited layout chain
  screen?: string     // View component path
}

export type RouteManifest = Record<string, RouteMetadata>

export function buildRouteManifest(routeTree: RouteNode): RouteManifest {
  const manifest: RouteManifest = {}

  // Track path and layouts for each node via closures
  const pathMap = new Map<RouteNode, string>()
  const layoutMap = new Map<RouteNode, string[]>()

  // Initialize root
  const rootPath = routeTree.segment === 'app' ? '/' : `/${routeTree.segment}`
  const rootLayouts = routeTree.layout ? [routeTree.layout] : []
  pathMap.set(routeTree, rootPath)
  layoutMap.set(routeTree, rootLayouts)

  traverseDepthFirst<RouteNode>({
    root: routeTree,
    expand: (node) => node.children,

    visit: (node) => {
      const currentPath = pathMap.get(node)!
      const currentLayouts = layoutMap.get(node)!
      
      // Validate: route groups can't have views
      if (node.isGroup && node.screen)
        throw new Error(`Invalid route: Route group "${node.segment}" cannot have a screen. Found: ${node.screen}`)
      
      // Add to manifest if has screen
      if (node.screen) {
        manifest[currentPath] = {
          path: currentPath,
          segment: node.segment,
          layouts: currentLayouts,
          screen: node.screen,
        }
      }
      
      // Compute context for children
      if (node.children) {
        for (const child of node.children) {
          const childPath = child.isGroup
            ? currentPath
            : currentPath === '/' ? `/${child.segment}` : `${currentPath}/${child.segment}`
          
          const childLayouts = child.layout
            ? [...currentLayouts, child.layout]
            : currentLayouts
          
          pathMap.set(child, childPath)
          layoutMap.set(child, childLayouts)
        }
      }
    },
  })

  return manifest
}
