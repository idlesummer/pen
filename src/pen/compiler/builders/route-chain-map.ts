import type { SegmentNode, SegmentRoles } from './segment-tree'
import { ancestors, traverse } from '@/lib/tree'
import { relative } from 'path'
import { removeExtension } from '@/lib/path-utils'

export type RouteChainMap = Record<string, Route>
export type Route = {
  url: string
  params: string[]  // param names extracted from dynamic segments, root→leaf order
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
export function createRouteChainMap(segmentTree: SegmentNode, outDir: string): RouteChainMap {
  const routes: RouteChainMap = {}
  const genDir = `${outDir}/generated`

  traverse(segmentTree, {
    expand: parentSegment => parentSegment.children ?? [],
    visit: segment => {
      if (!segment.roles.screen) return
      const url = segment.url
      const params = collectParams(segment)
      const chain = createSegmentChain(segment, genDir)
      routes[url] = { url, params, chain }
    },
  })
  return routes
}

/** Collects dynamic param names from root → leaf order. */
function collectParams(segment: SegmentNode): string[] {
  const params: string[] = []
  ancestors(segment, {
    parent: ancestorSegment => ancestorSegment.parent,
    visit: ancestorSegment => {
      if (ancestorSegment.param)
        params.push(ancestorSegment.param)
    },
  })
  return params.reverse() // ancestors() goes leaf→root; flip to root→leaf
}

/** Builds ancestor chain from leaf → root order. */
function createSegmentChain(segment: SegmentNode, genDir: string) {
  const chain: SegmentRoles[] = []

  ancestors(segment, {
    parent: ancestorSegment => ancestorSegment.parent,
    visit: ancestorSegment => {
      const roles: SegmentRoles = {}
      const entries = Object.entries(ancestorSegment.roles) as [keyof SegmentRoles, string][]
      if (!entries.length) return // skip segments with no roles

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
