import type { Route, RouteManifest } from './route-manifest'
import type { ComponentImportData } from './component-imports'

export interface ElementTree {
  component: string
  props: Record<string, unknown>
  children?: ElementTree
}

export type ElementTreeMap = Record<string, ElementTree>

/**
 * Creates element trees for all routes in the manifest.
 * Each tree represents the nested React component structure for a route.
 */
export function createElementTrees(manifest: RouteManifest, componentImports: ComponentImportData) {
  const trees: ElementTreeMap = {}

  for (const [url, route] of Object.entries(manifest))
    trees[url] = createElementTree(route, componentImports)
  return trees
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
function createElementTree(route: Route, { indices, imports }: ComponentImportData): ElementTree {
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
