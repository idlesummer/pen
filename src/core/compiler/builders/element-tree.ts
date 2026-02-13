import type { Route, RouteManifest } from './route-manifest'
import { SEGMENT_ROLES } from './segment-tree'

export interface ElementTree {
  component: string
  props: Record<string, unknown>
  children?: ElementTree
}

export type ElementTreeMap = Record<string, ElementTree>

/**
 * Component import mapping built from manifest.
 * Maps import paths to component IDs for code generation.
 */
export interface ComponentMapping {
  /** Map from import path to component index (keys are in sorted order) */
  indices: Record<string, number>
}

/**
 * Get sorted array of import paths from component mapping.
 * Keys are guaranteed to be in sorted order.
 */
export function getImports(mapping: ComponentMapping): string[] {
  return Object.keys(mapping.indices)
}

/**
 * Creates element trees for all routes in the manifest.
 * Each tree represents the nested React component structure for a route.
 * Returns both the trees and the component mapping for code generation.
 */
export function createElementTrees(manifest: RouteManifest) {
  const trees: ElementTreeMap = {}
  const mapping = buildComponentMapping(manifest)

  for (const [url, route] of Object.entries(manifest))
    trees[url] = createElementTree(route, mapping)
  return { trees, mapping }
}

/**
 * Builds a mapping of import paths to component IDs from the manifest.
 * Collects all unique import paths and assigns them indices.
 * Keys are stored in sorted order for deterministic output.
 */
function buildComponentMapping(manifest: RouteManifest): ComponentMapping {
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
  const indices: Record<string, number> = {}
  for (let i = 0; i < imports.length; i++)
    indices[imports[i]!] = i

  return { indices }
}

/**
 * Builds a structured element tree representing nested React components.
 *
 * This function mirrors the runtime composition logic but creates a structured data tree
 * that will be serialized into createElement calls for the generated routes.ts file.
 *
 * Composition order per segment (inside to outside):
 * 1. Screen component (only in leaf segment)
 * 2. Not-found boundary (wraps screen if present)
 * 3. Layout (wraps content)
 * 4. Error boundary (wraps layout + all descendants)
 */
function createElementTree(route: Route, mapping: ComponentMapping): ElementTree {
  const { indices } = mapping
  const imports = getImports(mapping)

  // Start with the screen from the first segment
  const screenSegment = route.chain[0]!
  const screenPath = screenSegment['screen']!
  const screenIndex = indices[screenPath]!
  const screenKey = JSON.stringify(imports[screenIndex]!)

  let tree: ElementTree = {
    component: `Component${screenIndex}`,
    props: { key: screenKey },
  }

  // Process segments from leaf → root (same order as runtime composition)
  for (const segment of route.chain) {
    // Not-found boundary
    if (segment['not-found']) {
      const path = segment['not-found']
      const index = indices[path]!
      const key = JSON.stringify(imports[index]!)
      const fallback = `Component${index}`
      tree = {
        component: 'NotFoundBoundary',
        props: { key, fallback },
        children: tree,
      }
    }
    // Error boundary
    if (segment['error']) {
      const path = segment['error']
      const index = indices[path]!
      const key = JSON.stringify(imports[index]!)
      const fallback = `Component${index}`
      tree = {
        component: 'ErrorBoundary',
        props: { key, fallback },
        children: tree,
      }
    }
    // Layout
    if (segment['layout']) {
      const path = segment['layout']
      const index = indices[path]!
      const key = JSON.stringify(imports[index]!)
      tree = {
        component: `Component${index}`,
        props: { key },
        children: tree,
      }
    }
  }
  return tree
}
