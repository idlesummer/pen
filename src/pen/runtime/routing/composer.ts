import type { ReactElement, ComponentType } from 'react'
import type { RouteChainMap } from '@/pen/compiler'
import type { ErrorComponentProps } from '../components/ErrorBoundary'
import type { NotFoundComponentProps } from '../components/NotFoundBoundary'
import { createElement } from 'react'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { NotFoundBoundary } from '../components/NotFoundBoundary'
import { NotFoundError } from '../errors'

export type PathComponentMap = Record<string, ComponentType>
export type RoutingTable = {
  routeChainMap: RouteChainMap
  pathComponentMap: PathComponentMap
}

export function composeRoute(url: string, routingTable: RoutingTable): ReactElement {
  const { routeChainMap, pathComponentMap } = routingTable
  const route = routeChainMap[url]
  if (!route) throw new NotFoundError(url)

  const screenPath = route.chain[0]!['screen']!
  const Screen = pathComponentMap[screenPath]!
  let element = createElement(Screen, { key: screenPath })

  for (const segment of route.chain) {
    if (segment['not-found']) {
      const fallback = pathComponentMap[segment['not-found']] as ComponentType<NotFoundComponentProps>
      const props = { key: segment['not-found'], fallback }
      element = createElement(NotFoundBoundary, props, element)
    }
    if (segment['error']) {
      const fallback = pathComponentMap[segment['error']] as ComponentType<ErrorComponentProps>
      const props = { key: segment['error'], fallback }
      element = createElement(ErrorBoundary, props, element)
    }
    if (segment['layout']) {
      const Layout = pathComponentMap[segment['layout']]!
      const props = { key: segment['layout'] }
      element = createElement(Layout, props, element)
    }
  }

  return element
}

/**
 * Composes a not-found element for a URL that doesn't match any route.
 * Finds the root chain's not-found component and wraps it in root layouts.
 * Returns null if no custom not-found component exists in the routing table.
 */
export function composeNotFoundRoute(url: string, routingTable: RoutingTable): ReactElement | null {
  const { routeChainMap, pathComponentMap } = routingTable
  const rootRoute = routeChainMap['/']
  if (!rootRoute) return null

  const notFoundPath = rootRoute.chain.find(s => s['not-found'])?.['not-found']
  if (!notFoundPath) return null

  const NotFoundComponent = pathComponentMap[notFoundPath] as ComponentType<NotFoundComponentProps>
  let element: ReactElement = createElement(NotFoundComponent, { url })

  for (const segment of rootRoute.chain) {
    if (segment['layout']) {
      const Layout = pathComponentMap[segment['layout']]!
      element = createElement(Layout, { key: segment['layout'] }, element)
    }
  }

  return element
}
