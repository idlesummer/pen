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
 * Builds a sorted list of component imports from a route manifest.
 * Each entry contains the absolute path and its relative import path.
 */
export function buildComponentImports(manifest: RouteManifest, outDir: string): ComponentImport[] {
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
  return entries.sort((a, b) => a.absolutePath.localeCompare(b.absolutePath))
}
