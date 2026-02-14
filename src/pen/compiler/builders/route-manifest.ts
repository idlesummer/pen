import type { SegmentNode, SegmentRoles } from './segment-tree'
import { ancestors, traverse } from '@/lib/tree'
import { relative } from 'path'
import { removeExtension } from '@/lib/path-utils'

export type RouteTable = Record<string, Route>
export type Route = {
  url: string
  chain: SegmentRoles[]
}

/**
 * Builds a route manifest from a segment tree.
 *
 * Flattens the tree into a dictionary mapping URLs to route metadata.
 * Only includes routes that have screens.
 * Paths are stored as relative import paths from the generated directory.
 *
 * @param segmentTree - Segment tree with parent pointers
 * @param outDir - Output directory (to calculate relative import paths)
 * @returns Flat manifest ready for runtime composition
 */
export function createRouteTable(segmentTree: SegmentNode, outDir: string): RouteTable {
  const manifest: RouteTable = {}
  const genDir = `${outDir}/generated`

  traverse(segmentTree, {
    expand: parentSegment => parentSegment.children ?? [],
    visit: segment => {
      if (!segment.roles.screen) return
      const url = segment.url
      const chain = createSegmentChain(segment, genDir)
      manifest[url] = { url, chain }
    },
  })
  return manifest
}

/** Builds ancestor chain from leaf → root order. */
function createSegmentChain(segment: SegmentNode, genDir: string) {
  const chain: SegmentRoles[] = []

  ancestors(segment, {
    parent: ancestorSegment => ancestorSegment.parent,
    visit: ancestorSegment => {
      const roles: SegmentRoles = {}
      const entries = Object.entries(ancestorSegment.roles) as [keyof SegmentRoles, string][]

      for (const [name, path] of entries) {
        if (name !== 'screen' || ancestorSegment === segment) { // Skip ancestor screens
          const importPath = removeExtension(path)              // Remove extension
          const relPath = relative(genDir, importPath).replace(/\\/g, '/')  // Convert to relative path
          roles[name] = `${relPath}.js`                         // Add .js for ES modules
        }
      }
      chain.push(roles)
    },
  })
  return chain
}
