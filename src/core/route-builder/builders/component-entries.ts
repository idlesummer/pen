import type { RouteManifest } from './route-manifest'
import { relative } from 'path'

/**
 * Component entry for codegen.
 * Maps the absolute file path to its import path.
 */
export interface ComponentEntry {
  /** Absolute file system path to the component */
  absolutePath: string
  /** Import path used in generated code */
  importPath: string
}

/**
 * Builds a sorted list of component entries from a route manifest.
 * Each entry contains the absolute path and its relative import path.
 */
export function buildComponentEntries(manifest: RouteManifest, outDir: string): ComponentEntry[] {
  const segmentPaths = new Set<string>()

  // Collect all unique absolute paths from manifest
  for (const route of Object.values(manifest)) {
    for (const segment of route.chain) {
      if (segment['screen'])    segmentPaths.add(segment['screen'])
      if (segment['not-found']) segmentPaths.add(segment['not-found'])
      if (segment['error'])     segmentPaths.add(segment['error'])
      if (segment['layout'])    segmentPaths.add(segment['layout'])
    }
  }

  // Build entries: absolute path → relative import path
  const genDir = `${outDir}/generated`
  const entries: ComponentEntry[] = []

  for (const absolutePath of segmentPaths) {
    // Calculate relative path and normalize to forward slashes for ES modules
    const relPath = relative(genDir, absolutePath).replace(/\\/g, '/')
    const importPath = `${relPath}.js`
    entries.push({ absolutePath, importPath })
  }

  // Sort by absolute path for deterministic output
  return entries.sort((a, b) => a.absolutePath.localeCompare(b.absolutePath))
}
