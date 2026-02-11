import { createElement } from 'react'

import { ErrorBoundary } from '../ui/ErrorBoundary'
import { NotFoundBoundary } from '../ui/NotFoundBoundary'
import { ComponentNotFoundError, EmptyChainError } from '../errors'

import type { ComponentType, ReactElement } from 'react'
import type { Route } from '@/core/route-builder'
import type { ErrorComponentProps } from '../ui/ErrorBoundary'
import type { NotFoundComponentProps } from '../ui/NotFoundBoundary'
import type { ComponentMap } from '../types'

/**
 * Gets a component from the component map or throws.
 */
function getComponent(components: ComponentMap, path: string): ComponentType {
  const component = components[path]
  if (!component) throw new ComponentNotFoundError(path)
  return component
}

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
  if (!route.chain.length)
    throw new EmptyChainError(route.url)

  // Start with the screen (guaranteed in first segment)
  const leafSegment = route.chain[0]!
  const screenPath = leafSegment['screen']!
  let element = createElement(getComponent(components, screenPath), { key: screenPath })

  // Process segments from leaf → root
  for (const segment of route.chain) {
    // Not-found boundary
    if (segment['not-found']) {
      const path = segment['not-found']
      const fallback = getComponent(components, path) as ComponentType<NotFoundComponentProps>
      element = createElement(NotFoundBoundary, { key: path, fallback }, element)
    }

    // Error boundary
    if (segment['error']) {
      const path = segment['error']
      const fallback = getComponent(components, path) as ComponentType<ErrorComponentProps>
      element = createElement(ErrorBoundary, { key: path, fallback }, element)
    }

    // Layout
    if (segment['layout']) {
      const path = segment['layout']
      element = createElement(getComponent(components, path), { key: path }, element)
    }
  }

  return element
}
