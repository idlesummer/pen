import type { Route, RouteChainMap } from './route-chain-map'
import type { ComponentIdMap } from './component-index-map'

export interface SerializedTree {
  component: string
  props: Record<string, unknown>
  children?: SerializedTree
}

export type SerializedRouteTreeMap = Record<string, SerializedTree>

/**
 * Creates element trees for all routeChain in the manifest.
 * Each tree represents the nested React component structure for a route.
 */
export function createSerializedRoutes(routeChain: RouteChainMap, componentIdMap: ComponentIdMap): SerializedRouteTreeMap {
  const serializedRoutes: SerializedRouteTreeMap = {}
  for (const [url, route] of Object.entries(routeChain))
    serializedRoutes[url] = createSerializedTree(route, componentIdMap)
  return serializedRoutes
}

/**
 * Builds a structured serialized element tree representing nested React components.
 *
 * This function creates a structured data tree that will be serialized into
 * createElement calls for the generated routeChain.ts file.
 */
function createSerializedTree(route: Route, mapping: ComponentIdMap): SerializedTree {
  const imports = Object.keys(mapping)

  // Start with the screen from the first segment
  const screenSegment = route.chain[0]!
  const screenPath = screenSegment['screen']!
  const screenIndex = mapping[screenPath]!
  const screenKey = JSON.stringify(imports[screenIndex]!)

  let tree: SerializedTree = {
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
