import { createElement, type ComponentType, type ReactElement } from 'react'
import { type Route } from '@/core/route-builder'
import { MissingScreenError } from '../errors'

/**
 * Maps component file paths to their loaded React components.
 * Used to resolve screen and layout components during composition.
 */
export type ComponentMap = Record<string, ComponentType>

/**
 * Composes a route element by wrapping the screen with layouts.
 * Returns a nested React element tree.
 */
export function composeRoute(route: Route, components: ComponentMap): ReactElement {
  if (!route.screen)
    throw new MissingScreenError(route.url)

  // Load and create the screen element
  const Screen = components[route.screen!]
  let element = createElement(Screen)

  // Wrap with layouts (leaf → root order)
  for (const path of route.layouts ?? []) {
    const Layout = components[path]
    element = createElement(Layout, null, element)
  }

  return element
}
