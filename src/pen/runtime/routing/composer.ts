import type { ReactElement, ComponentType } from 'react'
import type { RouteTreeNode, SegmentLayer } from '@/pen/compiler'
import type { ErrorComponentProps } from '../components/ErrorBoundary'
import type { NotFoundComponentProps } from '../components/NotFoundBoundary'
import { createElement } from 'react'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { NotFoundBoundary } from '../components/NotFoundBoundary'
import { NotFoundError } from '../errors'

export type PathComponentMap = Record<string, ComponentType>
export type RoutingTable = {
  routeTree: RouteTreeNode
  pathComponentMap: PathComponentMap
}

/**
 * Composes a React element from a pre-built segment role chain.
 *
 * @param chain - Roles in leaf-to-root order. chain[0] is the matched leaf's roles (including
 *                screen), subsequent entries are ancestor roles applied outward.
 * @param url - The URL being rendered, used in NotFoundError messages.
 * @param pathComponentMap - Map of import paths to loaded components.
 */
export function composeSegmentLayerChain(chain: SegmentLayer[], url: string, pathComponentMap: PathComponentMap): ReactElement {
  const screenPath = chain[0]?.['screen']
  let element = screenPath
    ? createElement(pathComponentMap[screenPath]!, { key: screenPath })
    : createElement(() => { throw new NotFoundError(url) })

  for (const segment of chain) {
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
