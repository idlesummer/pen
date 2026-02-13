import type { RouteManifest } from './route-manifest'
import { SEGMENT_ROLES } from './segment-tree'

/** Map from import path to component index (keys are in sorted order) */
export type ComponentMap = Record<string, number>

/**
 * Builds a mapping of import paths to component IDs from the manifest.
 * Collects all unique import paths and assigns them indices.
 * Keys are stored in sorted order for deterministic output.
 */
export function createComponentMap(manifest: RouteManifest): ComponentMap {
  const importPaths = new Set<string>()

  // Collect all unique import paths from manifest
  for (const route of Object.values(manifest)) {
    for (const segment of route.chain) {
      for (const role of SEGMENT_ROLES)
        if (segment[role]) importPaths.add(segment[role])
    }
  }

  // Sort for deterministic output
  const imports = Array.from(importPaths).sort()
  const mapping: ComponentMap = {}
  for (let i = 0; i < imports.length; i++)
    mapping[imports[i]!] = i

  return mapping
}
