import type { RouteManifest } from './route-manifest'
import { relative } from 'path'
import { SEGMENT_ROLES } from './segment-tree'

/**
 * Component import data including both the array and lookup map.
 */
export interface ComponentImportData {
  /** Sorted array of import paths (index = component number) */
  imports: readonly string[]
  /** Lookup map from absolute path to component index */
  indices: Record<string, number>
}

/**
 * Creates component import data from a route manifest.
 * Returns both the sorted import array and a lookup map for efficient access.
 */
export function createComponentImports(manifest: RouteManifest, outDir: string): ComponentImportData {
  const segmentPaths = new Set<string>()

  // Collect all unique absolute paths from manifest
  for (const route of Object.values(manifest)) {
    for (const segment of route.chain) {
      for (const role of SEGMENT_ROLES)
        if (segment[role]) segmentPaths.add(segment[role])
    }
  }

  // Sort absolute paths for deterministic output
  const sortedPaths = Array.from(segmentPaths).sort()

  // Build import paths and indices map
  const genDir = `${outDir}/generated`
  const imports: string[] = []
  const indices: Record<string, number> = {}

  for (let i = 0; i < sortedPaths.length; i++) {
    const absPath = sortedPaths[i]!
    // Calculate relative path and normalize to forward slashes for ES modules
    const relPath = relative(genDir, absPath).replace(/\\/g, '/')
    const importPath = `${relPath}.js`
    imports.push(importPath)
    indices[absPath] = i
  }

  return { imports, indices }
}
