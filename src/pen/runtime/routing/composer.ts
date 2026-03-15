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

export function composeRoute(url: string, routingTable: RoutingTable, notFoundUrl?: string): ReactElement {
  const { routeChainMap, pathComponentMap } = routingTable
  const route = routeChainMap[url]
  if (!route) throw new NotFoundError(notFoundUrl ?? url)

  const screenPath = route.chain[0]?.['screen']
  let element = notFoundUrl != null
    ? createElement(() => { throw new NotFoundError(notFoundUrl) })
    : screenPath
      ? createElement(pathComponentMap[screenPath]!, { key: screenPath })
      : createElement(() => { throw new NotFoundError(url) })

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
 * Finds the nearest ancestor with a not-found boundary and renders it.
 * Only called when `url` has no matching route.
 */
export function composeNearestAncestorRoute(url: string, routingTable: RoutingTable): ReactElement {
  const { routeChainMap } = routingTable
  let ancestorUrl = getParentUrl(url)

  while (ancestorUrl !== null) {  // while not at root
    const route = routeChainMap[ancestorUrl]
    if (route?.chain.some(segment => segment['not-found']))
      return composeRoute(ancestorUrl, routingTable, url)

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
