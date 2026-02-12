import type { RouteManifest } from './route-manifest'
import { relative } from 'path'
import { SEGMENT_ROLES } from './segment-tree'

/**
 * Component import for codegen.
 * Maps the absolute file path to its import path.
 */
export interface ComponentImport {
  /** Absolute file system path to the component */
  absolutePath: string
  /** Import path used in generated code */
  importPath: string
}

/**
 * Component import data including both the array and lookup map.
 */
export interface ComponentImportData {
  /** Sorted array of component imports */
  imports: ComponentImport[]
  /** Lookup map from absolute path to component index */
  indices: Record<string, number>
}

/**
 * Builds component import data from a route manifest.
 * Returns both the sorted import array and a lookup map for efficient access.
 */
export function buildComponentImports(manifest: RouteManifest, outDir: string): ComponentImportData {
  const segmentPaths = new Set<string>()

  // Collect all unique absolute paths from manifest
  for (const route of Object.values(manifest)) {
    for (const segment of route.chain) {
      for (const role of SEGMENT_ROLES)
        if (segment[role]) segmentPaths.add(segment[role])
    }
  }

  // Build entries: absolute path → relative import path
  const genDir = `${outDir}/generated`
  const entries: ComponentImport[] = []

  for (const absolutePath of segmentPaths) {
    // Calculate relative path and normalize to forward slashes for ES modules
    const relPath = relative(genDir, absolutePath).replace(/\\/g, '/')
    const importPath = `${relPath}.js`
    entries.push({ absolutePath, importPath })
  }

  // Sort by absolute path for deterministic output
  const imports = entries.sort((a, b) => a.absolutePath.localeCompare(b.absolutePath))

  // Build lookup map from absolute path to component index
  const indices = Object.fromEntries(
    imports.map((e, i) => [e.absolutePath, i])
  )

  return { imports, indices }
}
