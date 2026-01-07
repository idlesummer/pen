import { removeExtension } from '@/lib/path-utils'
import { traverseDepthFirst } from '@/lib/traversal'
import type { RouteNode } from './route-tree'

export type RouteManifest = Record<string, Route>
export type Route = {
  url: string           // url path like '/blog/'
  screen?: string       // path to screen
  layouts?: string[]    // inherited layouts
  error?: string        // nearest error boundary
  'not-found'?: string  // nearest not found boundary
}

export function buildRouteManifest(routeTree: RouteNode): RouteManifest {
  // Initialize routeTree file maps
  const rootLayouts = routeTree.roles.layout ? [removeExtension(routeTree.roles.layout)] : []
  const rootError   = routeTree.roles.error ? removeExtension(routeTree.roles.error) : undefined
  const rootNotFound = routeTree.roles['not-found'] ? removeExtension(routeTree.roles['not-found']) : undefined

  const layoutMap   = new Map([[routeTree, rootLayouts]])
  const errorMap    = new Map([[routeTree, rootError]])
  const notFoundMap = new Map([[routeTree, rootNotFound]])
  const manifest: Record<string, Route> = {}

  /** Add routes with screens to manifest */
  function visit(parentRoute: RouteNode) {
    const parentLayouts = layoutMap.get(parentRoute)!   // Always available
    const parentError = errorMap.get(parentRoute)       // May be undefined
    const parentNotFound = notFoundMap.get(parentRoute)

    // Only create manifest if this route has a screen
    if (!parentRoute.roles.screen) return

    const url = parentRoute.url
    const screen = parentRoute.roles.screen
    const metadata: Route = { url, screen: removeExtension(screen) }

    if (parentLayouts.length) metadata.layouts = parentLayouts.toReversed()
    if (parentError)    metadata.error = parentError
    if (parentNotFound) metadata['not-found'] = parentNotFound

    manifest[parentRoute.url] = metadata
  }

  /** Get children and compute their layouts */
  function expand(parentRoute: RouteNode) {
    // Always available
    const parentLayouts = layoutMap.get(parentRoute)!   // Always available
    const parentError   = errorMap.get(parentRoute)     // May be undefined
    const parentNotFound = notFoundMap.get(parentRoute)

    // Compute layouts for children in layout map to use them later
    for (const route of parentRoute.children ?? []) {
      // Nest parent layouts
      const layouts = route.roles.layout ? [...parentLayouts, removeExtension(route.roles.layout)] : parentLayouts
      layoutMap.set(route, layouts)

      // If this route has error, use it, else inherit parent's
      const error = route.roles.error ? removeExtension(route.roles.error) : parentError
      errorMap.set(route, error)

      // Inherit not-found from parent
      const notFound = route.roles['not-found'] ? removeExtension(route.roles['not-found']) : parentNotFound
      notFoundMap.set(route, notFound)
    }
    return parentRoute.children
  }

  traverseDepthFirst<RouteNode>({ root: routeTree, visit, expand })
  return manifest
}
