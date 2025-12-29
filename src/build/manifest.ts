import { traverseDepthFirst } from '@/lib/traversal'
import type { RouteNode } from '@/build/route-tree'


export type RouteManifest = Record<string, RouteMetadata>
export type RouteMetadata = {
  url: string         // url path like '/blog/'
  screen?: string     // path to screen.tsx
  layouts?: string[]  // inherited layouts (routeTree to leaf)
}


export function buildRouteManifest(routeTree: RouteNode) {
  // Initialize routeTree layout
  const rootLayouts = routeTree.layout ? [routeTree.layout] : []
  const layoutMap = new Map([[routeTree, rootLayouts]])
  const manifest: Record<string, RouteMetadata> = {}

  /** Add routes with screens to manifest */
  function visit(parentRoute: RouteNode) {
    // Always available
    const parentLayouts = layoutMap.get(parentRoute)!
    if (!parentRoute.screen) return // Only create manifest if this route has a screen
    
    const { url, screen } = parentRoute
    const metadata: RouteMetadata = { url, screen }
    
    if (parentLayouts.length) 
      metadata.layouts = parentLayouts.toReversed()
    manifest[parentRoute.url] = metadata
  }

  /** Get children and compute their layouts */
  function expand(parentRoute: RouteNode) {
    // Always available
    const parentLayouts = layoutMap.get(parentRoute)!

    // Compute layouts for children in layout map to use them later
    for (const route of parentRoute.children ?? []) {
      const layouts = route.layout ? [...parentLayouts, route.layout] : parentLayouts
      layoutMap.set(route, layouts)
    }
    return parentRoute.children
  }

  traverseDepthFirst<RouteNode>({ root: routeTree, visit, expand })
  return manifest
}
