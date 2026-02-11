import type { Route, ComponentEntry } from '@/core/route-builder'

/**
 * Generates a route element by composing React components into nested createElement calls.
 *
 * This function mirrors the runtime composition logic but generates static code strings
 * that will be written to the generated routes.ts file.
 *
 * Composition order per segment (inside to outside):
 * 1. Screen component (only in leaf segment)
 * 2. Not-found boundary (wraps screen if present)
 * 3. Layout (wraps content)
 * 4. Error boundary (wraps layout + all descendants)
 *
 * @param route - The route to generate code for
 * @param componentEntries - Array of component entries with absolute and import paths
 * @returns A code string that creates the nested React element
 *
 * @example
 * ```ts
 * generateRouteElement(route, components)
 * // Returns: "createElement(ErrorBoundary, { ... }, createElement(Component0, ...))"
 * ```
 */
export function generateRouteElement(route: Route, componentEntries: ComponentEntry[]): string {
  const getComponentIndex = (path: string) => {
    const index = componentEntries.findIndex((entry) => entry.absolutePath === path)
    if (index === -1) throw new Error(`Component not found: ${path}`)
    return index
  }

  // Start with the screen from the first segment
  const leafSegment = route.chain[0]!
  const screenPath = leafSegment['screen']!
  const screenIndex = getComponentIndex(screenPath)
  let element = `createElement(Component${screenIndex}, { key: '${screenPath}' })`

  // Process segments from leaf → root (same order as runtime composition)
  for (const segment of route.chain) {
    // Not-found boundary
    if (segment['not-found']) {
      const path = segment['not-found']
      const index = getComponentIndex(path)
      element = `createElement(NotFoundBoundary, { key: '${path}', fallback: Component${index} }, ${element})`
    }

    // Error boundary
    if (segment['error']) {
      const path = segment['error']
      const index = getComponentIndex(path)
      element = `createElement(ErrorBoundary, { key: '${path}', fallback: Component${index} }, ${element})`
    }

    // Layout
    if (segment['layout']) {
      const path = segment['layout']
      const index = getComponentIndex(path)
      element = `createElement(Component${index}, { key: '${path}' }, ${element})`
    }
  }

  return element
}
