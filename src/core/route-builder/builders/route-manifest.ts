import type { SegmentNode, SegmentRoles } from './segment-tree'
import { removeExtension } from '@/lib/path-utils'
import { ancestors, traverse } from '@/lib/tree'

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
export function createRouteManifest(segmentTree: SegmentNode): RouteManifest {
  const manifest: RouteManifest = {}

  traverse(segmentTree, {
    expand: parentSegment => parentSegment.children ?? [],
    visit: segment => {
      if (!segment.roles.screen) return

      const url = segment.url
      const chain = createSegmentChain(segment)
      manifest[url] = { url, chain }
    },
  })

  return manifest
}

/** Builds ancestor chain from leaf → root order. */
function createSegmentChain(segment: SegmentNode) {
  const chain: SegmentRoles[] = []

  ancestors(segment, {
    parent: ancestorSegment => ancestorSegment.parent,
    visit: (ancestorSegment) => {
      const roles: SegmentRoles = {}
      const entries = Object.entries(ancestorSegment.roles) as [keyof SegmentRoles, string][]

      for (const [name, path] of entries)
        if (name !== 'screen' || ancestorSegment === segment) // Skip ancestor screens
          roles[name] = removeExtension(path)
      chain.push(roles)
    },
  })
  return chain
}
