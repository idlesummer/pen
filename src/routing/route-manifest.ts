import { traverseDepthFirst } from '@/lib/traversal'
import type { RouteNode } from '@/routing/route-tree'


export type RouteMetadata = {
  url: string         // url path like '/blog/'
  segment: string     // last segment like 'blog'
  screen?: string     // path to screen.tsx
  layouts?: string[]  // inherited layouts (routeTree to leaf)
}

export function buildRouteManifest(routeTree: RouteNode) {
  // Initialize routeTree layout
  const rootLayouts = routeTree.layout ? [routeTree.layout] : []
  const layoutMap = new Map([[routeTree, rootLayouts]])
  const manifest: Record<string, RouteMetadata> = {}

  function visit(parentRoute: RouteNode) {
    const parentLayouts = layoutMap.get(parentRoute)!

    // Only create a manifest if parentRoute has a screen
    if (parentRoute.screen) {
      const { url, segment, screen } = parentRoute
      const metadata: RouteMetadata = { url, segment, screen }
      
      if (parentLayouts) 
        metadata.layouts = parentLayouts
      manifest[parentRoute.url] = metadata
    }

    // Compute layouts for children
    for (const child of parentRoute.children ?? []) {
      const layouts = child.layout 
        ? [...parentLayouts, child.layout] 
        : parentLayouts
      layoutMap.set(child, layouts)
    }
  }

  function expand(parentRoute: RouteNode) {
    return parentRoute.children
  }

  traverseDepthFirst<RouteNode>({ root: routeTree, visit, expand })
  return manifest
}
