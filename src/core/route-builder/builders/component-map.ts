import type { RouteManifest } from './route-manifest'
import { relative } from 'path'

/**
 * Maps absolute component file paths to their relative import paths.
 */
export type ComponentImportMap = Record<string, string>

/**
 * Builds a component map from a route manifest.
 * Maps absolute component paths to relative import paths.
 */
export function buildComponentMap(manifest: RouteManifest, outDir: string): ComponentImportMap {
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

  // Build map: absolute path → relative import path
  const componentMap: ComponentImportMap = {}
  const genDir = `${outDir}/generated`

  for (const absPath of segmentPaths) {
    // Calculate relative path and normalize to forward slashes for ES modules
    const relPath = relative(genDir, absPath).replace(/\\/g, '/')
    const importPath = `${relPath}.js`
    componentMap[absPath] = importPath
  }

  return componentMap
}
