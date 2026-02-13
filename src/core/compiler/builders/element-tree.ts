import type { Route, RouteManifest } from './route-manifest'
import { SEGMENT_ROLES } from './segment-tree'

export interface ElementTree {
  component: string
  props: Record<string, unknown>
  children?: ElementTree
}

export type ElementTreeMap = Record<string, ElementTree>

/** Map from import path to component index (keys are in sorted order) */
export type ComponentMap = Record<string, number>

/**
 * Creates element trees for all routes in the manifest.
 * Each tree represents the nested React component structure for a route.
 */
export function createElementTrees(manifest: RouteManifest, componentMap: ComponentMap): ElementTreeMap {
  const elementTrees: ElementTreeMap = {}
  for (const [url, route] of Object.entries(manifest))
    elementTrees[url] = createElementTree(route, componentMap)
  return elementTrees
}

/**
 * Builds a mapping of import paths to component IDs from the manifest.
 * Collects all unique import paths and assigns them indices.
 * Keys are stored in sorted order for deterministic output.
 */
export function buildComponentMap(manifest: RouteManifest): ComponentMap {
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
function createElementTree(route: Route, mapping: ComponentMap): ElementTree {
  const imports = Object.keys(mapping)

  // Start with the screen from the first segment
  const screenSegment = route.chain[0]!
  const screenPath = screenSegment['screen']!
  const screenIndex = mapping[screenPath]!
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
      const index = mapping[path]!
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
      const index = mapping[path]!
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
      const index = mapping[path]!
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
