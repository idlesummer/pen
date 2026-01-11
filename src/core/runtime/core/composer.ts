import { createElement, type ComponentType, type ReactElement } from 'react'
import { type Route } from '@/core/route-builder'
import { ErrorBoundary, type ErrorComponentProps } from '../components/ErrorBoundary'
import { NotFoundBoundary, type NotFoundComponentProps } from '../components/NotFoundBoundary'
import { ComponentNotFoundError, EmptyChainError } from '../errors'

/**
 * Maps component file paths to their loaded React components.
 */
export type ComponentMap = Record<string, ComponentType>

/**
 * Composes a route element by processing each segment in the chain.
 *
 * Composition order per segment (inside to outside):
 * 1. Screen component (only in leaf segment)
 * 2. Not-found boundary (wraps screen if present)
 * 3. Layout (wraps content)
 * 4. Error boundary (wraps layout + all descendants)
 *
 * This ensures error boundaries catch errors at the right level,
 * and only layouts above the error remain visible.
 */
export function composeRoute(route: Route, components: ComponentMap): ReactElement {

  // Check if chain is guaranteed non-empty
  if (!route.chain.length)
    throw new EmptyChainError(route.url)

  // Start with the screen (guaranteed in first segment by route manifest)
  const leafSegment = route.chain[0]!       // Guaranteed chain is non-empty
  const screenPath = leafSegment['screen']! // Guaranteed leaf to be in screen
  const Screen = components[screenPath]
  if (!Screen) throw new ComponentNotFoundError(screenPath)

  let element: ReactElement = createElement(Screen, { key: screenPath })

  // Process segments from leaf → root
  for (const segment of route.chain) {

    // Not-found boundary (wraps screen/children)
    if (segment['not-found']) {
      const notFoundPath = segment['not-found']
      const NotFoundComponent = components[notFoundPath]
      if (!NotFoundComponent)
        throw new ComponentNotFoundError(notFoundPath)

      const fallback = NotFoundComponent as ComponentType<NotFoundComponentProps>
      element = createElement(NotFoundBoundary, { key: notFoundPath, fallback }, element)
    }

    // Error boundary (wraps not-found + content)
    if (segment['error']) {
      const errorPath = segment['error']
      const ErrorComponent = components[errorPath]
      if (!ErrorComponent)
        throw new ComponentNotFoundError(errorPath)

      const fallback = ErrorComponent as ComponentType<ErrorComponentProps>
      element = createElement(ErrorBoundary, { key: errorPath, fallback }, element)
    }

    // Layout (wraps error boundary + all descendants)
    if (segment['layout']) {
      const layoutPath = segment['layout']
      const LayoutComponent = components[layoutPath]
      if (!LayoutComponent)
        throw new ComponentNotFoundError(layoutPath)

      element = createElement(LayoutComponent, { key: layoutPath }, element)
    }
  }

  return element
}
