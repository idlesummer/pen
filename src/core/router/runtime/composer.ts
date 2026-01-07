import { createElement, type ComponentType, type ReactElement } from 'react'
import { type Route } from '@/core/route-builder'
import { ErrorBoundary, type ErrorComponentProps } from '../components/ErrorBoundary'
import { MissingScreenError } from '../errors'

/**
 * Maps component file paths to their loaded React components.
 */
export type ComponentMap = Record<string, ComponentType>

/**
 * Composes a route element by wrapping the screen with layouts and error boundary.
 *
 * Composition order (inside to outside):
 * 1. Screen component
 * 2. Error boundary (wraps screen)
 * 3. Layouts (wrap error boundary)
 *
 * This ensures:
 * - Error boundary catches screen errors
 * - Layouts remain visible when errors occur
 * - Matches Next.js behavior
 */
export function composeRoute(route: Route, components: ComponentMap): ReactElement {
  if (!route.screen)
    throw new MissingScreenError(route.url)

  // Step 1: Load and create the screen element
  const Screen = components[route.screen]
  let element = createElement(Screen)

  // Step 2: Wrap screen with its error boundary (if exists)
  if (route.error) {
    const ErrorComponent = components[route.error] as ComponentType<ErrorComponentProps>
    element = createElement(ErrorBoundary, { fallback: ErrorComponent, key: route.url }, element)
  }

  // Step 3: Wrap with layouts (leaf → root order)
  for (const layoutPath of route.layouts ?? []) {
    const Layout = components[layoutPath]
    element = createElement(Layout, null, element)
  }

  return element
}
