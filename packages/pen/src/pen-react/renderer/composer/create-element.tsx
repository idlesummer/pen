import type { ReactNode } from 'react'
import type { RouteMatcher } from '@/pen-core'
import type { ComponentMap } from '@/pen-react/modules'
import type { ComponentFrame, ComponentMatch } from './component-tree'
import { AwaitComponent } from '@/lib/await-component'
import { DefaultBoundary } from '@/pen-react/modules/components/DefaultBoundary'
import { LoadingBoundary } from '@/pen-react/modules/components/LoadingBoundary'
import { ErrorBoundary } from '@/pen-react/modules/components/ErrorBoundary'
import { createComponentMatchTree } from './component-tree'
import { sliceRecord } from '@/lib/record'

type ReactNodeMap = Record<string, ReactNode>

/** Wraps child with a frame's default/loading/error boundaries - shared by
 *  both the main and leaf (slot-owned) frame wrapping. */
function wrapBoundaries(route: string, frame: ComponentFrame, child: ReactNode): ReactNode {
  if (frame.Default)
    child = <DefaultBoundary Fallback={frame.Default} route={route} params={frame.params}>{child}</DefaultBoundary>
  if (frame.Loading)
    child = <LoadingBoundary Fallback={frame.Loading}>{child}</LoadingBoundary>
  if (frame.Error)
    child = <ErrorBoundary Fallback={frame.Error} route={route}>{child}</ErrorBoundary>
  return child
}

/** Wraps child with a slot-owned frame's boundaries and layout. A slot's own
 *  chain can never declare further slots, so there's nothing else to render. */
function wrapLeafFrame(route: string, frame: ComponentFrame, child: ReactNode): ReactNode {
  child = wrapBoundaries(route, frame, child)
  if (frame.Layout)
    child = <frame.Layout params={frame.params}>{child}</frame.Layout>
  return child
}

/** Wraps a slot-owned match's content with its own frame chain, from inner to outer. */
function renderLeafChain(route: string, match: ComponentMatch): ReactNode {
  const { endpoint, params } = match
  const Content = endpoint.content
  const contentProps = { params: sliceRecord(params, endpoint.paramCount) }

  const contentElement = Content.constructor.name === 'AsyncFunction'
    ? <AwaitComponent resolve={Content(contentProps) as Promise<ReactNode>} />
    : <Content {...contentProps} />

  return endpoint.frames.reduceRight<ReactNode>(
    (child, frame) => wrapLeafFrame(route, frame, child),
    contentElement,
  )
}

/** Wraps child with a frame's boundaries, layout, and slots. Every slot
 *  already carries its own resolved match, so it's rendered right here,
 *  on the way up through this specific frame. */
function wrapFrame(route: string, frame: ComponentFrame, child: ReactNode): ReactNode {
  child = wrapBoundaries(route, frame, child)
  if (frame.Layout) {
    const slots: ReactNodeMap | undefined = frame.slots && Object.fromEntries(
      Object.entries(frame.slots).map(([name, slotMatch]) => [name, renderLeafChain(route, slotMatch)]),
    )
    child = <frame.Layout params={frame.params} {...slots}>{child}</frame.Layout>
  }
  return child
}

/** Wraps endpoint content with its frame chain, from inner to outer. */
function renderChain(route: string, match: ComponentMatch): ReactNode {
  const { endpoint, params } = match
  const Content = endpoint.content
  const contentProps = { params: sliceRecord(params, endpoint.paramCount) }

  const contentElement = Content.constructor.name === 'AsyncFunction'
    ? <AwaitComponent resolve={Content(contentProps) as Promise<ReactNode>} />
    : <Content {...contentProps} />

  return endpoint.frames.reduceRight<ReactNode>(
    (child, frame) => wrapFrame(route, frame, child),
    contentElement,
  )
}

/** Resolves a match against the component map and turns it into a React
 *  element tree, wrapping the main chain and rendering each frame's own
 *  slots inline as it goes.
 *
 *  @param route - The route being rendered, passed through to boundaries.
 *  @param routeMatcher - Matches the route against the position tree.
 *  @param components - The component map used to resolve path references. */
export function createRouteElement(route: string, routeMatcher: RouteMatcher, components: ComponentMap): ReactNode {
  const routeMatch = routeMatcher(route)
  const mainMatch = createComponentMatchTree(routeMatch, components)
  return renderChain(route, mainMatch)
}
