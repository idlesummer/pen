import { removeExtension } from '@/lib/path-utils'
import { traverseDepthFirst } from '@/lib/traversal'
import type { SegmentNode } from './segment-tree'

export type RouteNode = {
  url: string           // url path like '/blog/'
  screen?: string       // path to screen
  layouts?: string[]    // inherited layouts
  error?: string        // nearest error boundary
  'not-found'?: string  // nearest not found boundary
}
export type RouteManifest = Record<string, RouteNode>

export function buildRouteManifest(segmentTree: SegmentNode): RouteManifest {
  // Initialize segmentTree file maps
  const rootLayouts = segmentTree.roles.layout ? [removeExtension(segmentTree.roles.layout)] : []
  const rootError   = segmentTree.roles.error ? removeExtension(segmentTree.roles.error) : undefined
  const rootNotFound = segmentTree.roles['not-found'] ? removeExtension(segmentTree.roles['not-found']) : undefined

  const layoutMap   = new Map([[segmentTree, rootLayouts]])
  const errorMap    = new Map([[segmentTree, rootError]])
  const notFoundMap = new Map([[segmentTree, rootNotFound]])
  const manifest: Record<string, RouteNode> = {}

  /** Add routes with screens to manifest */
  function visit(parentSegment: SegmentNode) {
    const parentLayouts = layoutMap.get(parentSegment)!   // Always available
    const parentError = errorMap.get(parentSegment)       // May be undefined
    const parentNotFound = notFoundMap.get(parentSegment)

    // Only create manifest if this route has a screen
    if (!parentSegment.roles.screen) return

    const url = parentSegment.url
    const screen = parentSegment.roles.screen
    const metadata: RouteNode = { url, screen: removeExtension(screen) }

    if (parentLayouts.length) metadata.layouts = parentLayouts.toReversed()
    if (parentError)    metadata.error = parentError
    if (parentNotFound) metadata['not-found'] = parentNotFound

    manifest[parentSegment.url] = metadata
  }

  /** Get children and compute their layouts */
  function expand(parentSegment: SegmentNode) {
    // Always available
    const parentLayouts = layoutMap.get(parentSegment)!   // Always available
    const parentError   = errorMap.get(parentSegment)     // May be undefined
    const parentNotFound = notFoundMap.get(parentSegment)

    // Compute layouts for children in layout map to use them later
    for (const route of parentSegment.children ?? []) {
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
    return parentSegment.children
  }

  traverseDepthFirst<SegmentNode>({ root: segmentTree, visit, expand })
  return manifest
}
