import { removeExtension } from '@/lib/path-utils'
import { traverseDepthFirst } from '@/lib/traversal'
import type { RouteNode } from './route-tree'

export type RouteManifest = Record<string, Route>
export type Route = {
  url: string         // url path like '/blog/'
  screen?: string     // path to screen (no extension)
  layouts?: string[]  // inherited layouts (no extensions, root to leaf order)
  error?: string      // nearest error boundary (no extension)
}

export function buildRouteManifest(routeTree: RouteNode): RouteManifest {
  // Initialize routeTree file maps
  const rootLayouts = routeTree.layout ? [removeExtension(routeTree.layout)] : []
  const rootError   = routeTree.error ? removeExtension(routeTree.error) : undefined
  const layoutMap   = new Map([[routeTree, rootLayouts]])
  const errorMap    = new Map([[routeTree, rootError]])
  const manifest: Record<string, Route> = {}

  /** Add routes with screens to manifest */
  function visit(parentRoute: RouteNode) {
    const parentLayouts = layoutMap.get(parentRoute)! // Always available
    const parentError = errorMap.get(parentRoute)     // May be undefined

    // Only create manifest if this route has a screen
    if (!parentRoute.screen) return

    const { url, screen } = parentRoute
    const metadata: Route = { url, screen: removeExtension(screen) }

    if (parentLayouts.length)
      metadata.layouts = parentLayouts.toReversed()
    if (parentError)
      metadata.error = parentError

    manifest[parentRoute.url] = metadata
  }

  /** Get children and compute their layouts */
  function expand(parentRoute: RouteNode) {
    // Always available
    const parentLayouts = layoutMap.get(parentRoute)! // Always available
    const parentError   = errorMap.get(parentRoute)   // May be undefined

    // Compute layouts for children in layout map to use them later
    for (const route of parentRoute.children ?? []) {
      // Nest parent layouts
      const layouts = route.layout ? [...parentLayouts, removeExtension(route.layout)] : parentLayouts
      layoutMap.set(route, layouts)

      // This route has error, use it, else inherit parent's
      const error = route.error ? removeExtension(route.error) : parentError
      errorMap.set(route, error)
    }
    return parentRoute.children
  }

  traverseDepthFirst<RouteNode>({ root: routeTree, visit, expand })
  return manifest
}
