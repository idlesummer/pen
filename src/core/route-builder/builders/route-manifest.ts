import { removeExtension } from '@/lib/path-utils'
import { collectAncestors, traverseDepthFirst } from '@/lib/tree-utils'
import type { SegmentNode, SegmentRoles } from './segment-tree'

export type RouteManifest = Record<string, Route>
export type Route = {
  url: string
  chain: SegmentRoles[]
}

/**
 * Builds a route manifest from a segment tree.
 *
 * Flattens the tree into a dictionary mapping URLs to route metadata.
 * Only includes routes that have screens.
 *
 * @param segmentTree - Segment tree with parent pointers
 * @returns Flat manifest ready for runtime composition
 */
export function buildRouteManifest(segmentTree: SegmentNode): RouteManifest {
  const manifest: RouteManifest = {}

  function visit(segment: SegmentNode) {
    // Only create manifest entry if this node has a screen
    if (!segment.roles.screen) return

    // Build ancestor chain (leaf → root order)
    const segmentChain = collectAncestors(
      segment,
      node => node.parent,
      ancestorSegment => {
        const roles: SegmentRoles = {}
        const entries = Object.entries(ancestorSegment.roles) as [keyof SegmentRoles, string][]

        for (const [roleName, path] of entries)
          if (roleName !== 'screen' || ancestorSegment === segment) // Skip ancestor screens
            roles[roleName] = removeExtension(path)

        return roles
      },
    )

    manifest[segment.url] = {
      url: segment.url,
      chain: segmentChain,
    }
  }

  traverseDepthFirst({
    root: segmentTree,
    visit,
    expand: parentSegment => parentSegment.children,
  })

  return manifest
}
