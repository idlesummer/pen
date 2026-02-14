import type { RouteChainMap } from './route-chain-map'
import { SEGMENT_ROLES } from './segment-tree'

/** Map from import path to component index (keys are in sorted order) */
export type ComponentIdMap = Record<string, number>

/**
 * Builds a mapping of import paths to component IDs from the manifest.
 * Collects all unique import paths and assigns them indices.
 * Keys are stored in sorted order for deterministic output.
 */
export function createComponentIdMap(routes: RouteChainMap): ComponentIdMap {
  const importPaths = new Set<string>()

  // Collect all unique import paths from manifest
  for (const route of Object.values(routes)) {
    for (const segment of route.chain) {
      for (const role of SEGMENT_ROLES)
        if (segment[role]) importPaths.add(segment[role])
    }
  }

  // Sort for deterministic output
  const imports = Array.from(importPaths).sort()
  const mapping: ComponentIdMap = {}
  for (let i = 0; i < imports.length; i++)
    mapping[imports[i]!] = i

  return mapping
}
