import type { ComponentType, ReactElement } from 'react'
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
  componentMap: PathComponentMap
}

/**
 * Composes a React element from a pre-built segment role chain.
 *
 * @param chain - Segment layers in leaf-to-root order.
 * @param componentMap - Map of import paths to loaded components.
 * @param url - The URL being rendered, used in NotFoundError messages.
 */
export function composeSegmentLayerChain(chain: SegmentLayer[], componentMap: PathComponentMap, url: string, throwNotFound?: boolean): ReactElement {
  const screenPath = !throwNotFound && chain[0]?.['screen']
  let element = screenPath
    ? createElement(componentMap[screenPath]!, { key: screenPath })
    : createElement(() => { throw new NotFoundError(url) })

  for (const segment of chain) {
    if (segment['not-found']) {
      const fallback = componentMap[segment['not-found']] as ComponentType<NotFoundComponentProps>
      const props = { key: segment['not-found'], fallback }
      element = createElement(NotFoundBoundary, props, element)
    }
    if (segment['error']) {
      const fallback = componentMap[segment['error']] as ComponentType<ErrorComponentProps>
      const props = { key: segment['error'], fallback }
      element = createElement(ErrorBoundary, props, element)
    }
    if (segment['layout']) {
      const Layout = componentMap[segment['layout']]!
      const props = { key: segment['layout'] }
      element = createElement(Layout, props, element)
    }
  }

  return element
}
