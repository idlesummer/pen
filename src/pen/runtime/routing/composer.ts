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

/** Composes a React element from a pre-built segment layer chain, rendering the leaf screen. */
export function composeSegmentLayerChain(chain: SegmentLayer[], componentMap: PathComponentMap, url: string): ReactElement {
  const screenPath = chain[0]?.['screen']
  const inner = screenPath
    ? createElement(componentMap[screenPath]!, { key: screenPath })
    : createElement(() => { throw new NotFoundError(url) })
  return compose(chain, componentMap, inner)
}

/** Composes a React element from a not-found chain, throwing NotFoundError as the inner element. */
export function composeNotFoundChain(chain: SegmentLayer[], componentMap: PathComponentMap, url: string): ReactElement {
  const inner = createElement(() => { throw new NotFoundError(url) })
  return compose(chain, componentMap, inner)
}

function compose(chain: SegmentLayer[], componentMap: PathComponentMap, inner: ReactElement): ReactElement {
  let element = inner

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
