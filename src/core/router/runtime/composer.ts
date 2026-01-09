// import { createElement, type ComponentType, type ReactElement } from 'react'
// import { type RouteNode } from '@/core/route-builder'
// import { ErrorBoundary, type ErrorComponentProps } from '../components/ErrorBoundary'
// import { NotFoundBoundary, NotFoundComponentProps } from '../components/NotFoundBoundary'
// import { MissingScreenError } from '../errors'

// /**
//  * Maps component file paths to their loaded React components.
//  */
// export type ComponentMap = Record<string, ComponentType>

// /**
//  * Composes a route element by wrapping the screen with layouts and error boundary.
//  *
//  * Composition order (inside to outside):
//  * 1. Screen component
//  * 2. Not found boundary (wraps screen)
//  * 2. Error boundary (wraps not found boundary)
//  * 4. Layouts (wrap error boundary)
//  *
//  * This ensures:
//  * - Error boundary catches screen errors
//  * - Layouts remain visible when errors occur
//  * - Matches Next.js behavior
//  */
// export function composeRoute(route: RouteNode, components: ComponentMap): ReactElement {
//   if (!route.screen)
//     throw new MissingScreenError(route.url)

//   // Step 1: Load and create the screen element
//   const Screen = components[route.screen]
//   let element = createElement(Screen)

//   // Step 2: Wrap with not-found boundary (if exists)
//   if (route['not-found']) {
//     const NotFoundComponent = components[route['not-found']] as ComponentType<NotFoundComponentProps>
//     element = createElement(NotFoundBoundary, { key: route.url, fallback: NotFoundComponent }, element)
//   }

//   // Step 3: Wrap screen with its error boundary (if exists)
//   if (route.error) {
//     const ErrorComponent = components[route.error] as ComponentType<ErrorComponentProps>
//     element = createElement(ErrorBoundary, { key: route.url, fallback: ErrorComponent }, element)
//   }

//   // Step 4: Wrap with layouts (leaf → root order)
//   for (const layoutPath of route.layouts ?? []) {
//     const Layout = components[layoutPath]
//     element = createElement(Layout, null, element)
//   }

//   return element
// }

// /**
// for each seglment in segment_chain:
//   element = createElement(Screen)
//   element = createElement(Loading)
//   element = createElement(NotFound)
//   element = createElement(Error)
//   element = createElement(Layout)
// */

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
