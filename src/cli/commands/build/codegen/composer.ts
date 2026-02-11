import type { Route } from '@/core/route-builder'

/**
 * Type of element in the composition tree.
 */
export type ElementType = 'component' | 'error-boundary' | 'not-found-boundary'

/**
 * Represents a composed element tree.
 * This is a pure data structure representing the component composition.
 */
export interface ComposedElement {
  /** Type of the element (component, boundary, etc.) */
  type: ElementType
  /** Index of the component in the imports array */
  componentIndex: number
  /** Optional child element to wrap */
  children?: ComposedElement
}

/**
 * Composes a route into a tree of elements.
 *
 * This is a pure function that builds the composition structure without generating code.
 * It mirrors the runtime composition logic by building the tree inside-out.
 *
 * Composition order per segment (inside to outside):
 * 1. Screen component (only in leaf segment)
 * 2. Not-found boundary (wraps screen if present)
 * 3. Layout (wraps content)
 * 4. Error boundary (wraps layout + all descendants)
 *
 * @param route - The route to compose
 * @param pathToIndex - Lookup table mapping absolute paths to component indices
 * @returns A composition tree representing the nested structure
 *
 * @example
 * ```ts
 * const tree = composeRoute(route, pathToIndex)
 * // Returns: { type: 'error-boundary', componentIndex: 2, children: { type: 'component', ... } }
 * ```
 */
export function composeRoute(
  route: Route,
  pathToIndex: Record<string, number>
): ComposedElement {
  const getComponentIndex = (path: string) => {
    const index = pathToIndex[path]
    if (index === undefined) throw new Error(`Component not found: ${path}`)
    return index
  }

  // Start with the screen from the first segment
  const leafSegment = route.chain[0]!
  const screenPath = leafSegment['screen']!
  const screenIndex = getComponentIndex(screenPath)
  let element: ComposedElement = {
    type: 'component',
    componentIndex: screenIndex,
  }

  // Process segments from leaf → root (same order as runtime composition)
  for (const segment of route.chain) {
    // Not-found boundary
    if (segment['not-found']) {
      const path = segment['not-found']
      const index = getComponentIndex(path)
      element = {
        type: 'not-found-boundary',
        componentIndex: index,
        children: element,
      }
    }

    // Error boundary
    if (segment['error']) {
      const path = segment['error']
      const index = getComponentIndex(path)
      element = {
        type: 'error-boundary',
        componentIndex: index,
        children: element,
      }
    }

    // Layout
    if (segment['layout']) {
      const path = segment['layout']
      const index = getComponentIndex(path)
      element = {
        type: 'component',
        componentIndex: index,
        children: element,
      }
    }
  }

  return element
}

/**
 * Renders a composed element tree into code string.
 *
 * This is a generic function that converts the composition tree into
 * createElement calls. The key expression is configurable via the getKeyExpr callback.
 *
 * @param element - The composed element tree to render
 * @param getKeyExpr - Function that generates the key expression for a component index
 * @returns A code string representing the nested createElement calls
 *
 * @example
 * ```ts
 * renderElementCode(tree, (i) => `paths[${i}]`)
 * // Returns: "createElement(ErrorBoundary, { key: paths[2], fallback: Component2 }, ...)"
 * ```
 */
export function renderElementCode(
  element: ComposedElement,
  getKeyExpr: (index: number) => string
): string {
  const { type, componentIndex, children } = element
  const key = getKeyExpr(componentIndex)

  // Recursively render children
  const childrenCode = children ? renderElementCode(children, getKeyExpr) : undefined

  switch (type) {
    case 'component':
      return childrenCode
        ? `createElement(Component${componentIndex}, { key: ${key} }, ${childrenCode})`
        : `createElement(Component${componentIndex}, { key: ${key} })`

    case 'error-boundary':
      return `createElement(ErrorBoundary, { key: ${key}, fallback: Component${componentIndex} }, ${childrenCode})`

    case 'not-found-boundary':
      return `createElement(NotFoundBoundary, { key: ${key}, fallback: Component${componentIndex} }, ${childrenCode})`
  }
}

/**
 * Generates a route element by composing React components into nested createElement calls.
 *
 * This is a convenience function that combines composeRoute and renderElementCode.
 * Uses importPaths array for keys.
 *
 * @param route - The route to generate code for
 * @param pathToIndex - Lookup table mapping absolute paths to component indices
 * @returns A code string that creates the nested React element
 *
 * @example
 * ```ts
 * generateRouteElement(route, pathToIndex)
 * // Returns: "createElement(ErrorBoundary, { ... }, createElement(Component0, ...))"
 * ```
 */
export function generateRouteElement(route: Route, pathToIndex: Record<string, number>) {
  const tree = composeRoute(route, pathToIndex)
  return renderElementCode(tree, (i) => `importPaths[${i}]`)
}
