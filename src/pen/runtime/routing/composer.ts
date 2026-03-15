import type { ReactElement, ComponentType } from 'react'
import type { RouteChain, RouteChainMap } from '@/pen/compiler'
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

/** Renders a screen element. */
export function composeScreenRoute(url: string, routingTable: RoutingTable): ReactElement {
  const { routeChainMap, pathComponentMap } = routingTable
  const route = routeChainMap[url]
  if (!route) throw new NotFoundError(url)

  const screenPath = route.chain[0]?.['screen']
  const leaf = screenPath
    ? createElement(pathComponentMap[screenPath]!, { key: screenPath })
    : createElement(() => { throw new NotFoundError(url) }) // throw if route exists but has no screen

  return composeRoute(route, pathComponentMap, leaf)
}

/** Renders an ancestor's shell but throws inside the NotFoundBoundary. */
function composeNotFoundRoute(ancestorUrl: string, notFoundUrl: string, routingTable: RoutingTable): ReactElement {
  const { routeChainMap, pathComponentMap } = routingTable
  const route = routeChainMap[ancestorUrl]!
  const leaf = createElement(() => { throw new NotFoundError(notFoundUrl) })
  return composeRoute(route, pathComponentMap, leaf)
}

function composeRoute(route: RouteChain, pathComponentMap: PathComponentMap, leaf: ReactElement): ReactElement {
  let element = leaf
  for (const segment of route.chain) {
    if (segment['not-found']) {
      const fallback = pathComponentMap[segment['not-found']] as ComponentType<NotFoundComponentProps>
      element = createElement(NotFoundBoundary, { key: segment['not-found'], fallback }, element)
    }
    if (segment['error']) {
      const fallback = pathComponentMap[segment['error']] as ComponentType<ErrorComponentProps>
      element = createElement(ErrorBoundary, { key: segment['error'], fallback }, element)
    }
    if (segment['layout']) {
      const Layout = pathComponentMap[segment['layout']]!
      element = createElement(Layout, { key: segment['layout'] }, element)
    }
  }
  return element
}

/**
 * Finds the nearest ancestor with a not-found boundary and renders it.
 * Only called when `url` has no matching route.
 */
export function composeNearestNotFoundRoute(url: string, routingTable: RoutingTable): ReactElement {
  const { routeChainMap } = routingTable
  let ancestorUrl = getParentUrl(url)

  while (ancestorUrl !== null) {  // while not at root
    const route = routeChainMap[ancestorUrl]
    if (route?.chain.some(segment => segment['not-found'])) // if route exists and not-found exists
      return composeNotFoundRoute(ancestorUrl, url, routingTable)

    ancestorUrl = getParentUrl(ancestorUrl)
  }

  // No ancestor has a not-found — let composeRoute throw as usual
  throw new NotFoundError(url)
}

/** Returns the parent URL by stripping the last path segment, or null if already at root. */
function getParentUrl(url: string): string | null {
  if (url === '/')
    return null

  const lastSlash = url.lastIndexOf('/', url.length-2)
  return url.slice(0, lastSlash+1)
}
