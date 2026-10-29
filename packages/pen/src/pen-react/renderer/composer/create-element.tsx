import type { ReactNode } from 'react'
import type { RouteMatcher } from '@/pen-core'
import type { ComponentMap } from '@/pen-react/modules'
import type { ComponentEndpoint, ComponentFrame } from './component-tree'
import { AwaitComponent } from '@/lib/await-component'
import { DefaultBoundary, ErrorBoundary, LoadingBoundary } from '@/pen-react/modules'
import { createComponentTree } from './component-tree'

/** Renders endpoint content, awaiting async components when necessary. */
function renderContent(endpoint: ComponentEndpoint): ReactNode {
  const { Content, params } = endpoint
  const props = { params }
  return Content.constructor.name === 'AsyncFunction'
    ? <AwaitComponent resolve={Content(props) as Promise<ReactNode>} />
    : <Content {...props} />
}

/** Wraps child with a frame's boundaries and layout. */
function wrapFrame(route: string, frame: ComponentFrame, child: ReactNode, slots?: Record<string, ReactNode>): ReactNode {
  if (frame.Default)
    child = <DefaultBoundary Fallback={frame.Default} route={route} params={frame.params}>{child}</DefaultBoundary>
  if (frame.Loading)
    child = <LoadingBoundary Fallback={frame.Loading}>{child}</LoadingBoundary>
  if (frame.Error)
    child = <ErrorBoundary Fallback={frame.Error} route={route}>{child}</ErrorBoundary>
  if (frame.Layout)
    child = <frame.Layout params={frame.params} {...slots}>{child}</frame.Layout>
  return child
}

/** Renders a slot-owned endpoint with its frame chain, from inner to outer. */
function renderSlotChain(route: string, endpoint: ComponentEndpoint): ReactNode {
  return endpoint.frames.reduceRight<ReactNode>(
    (child, frame) => wrapFrame(route, frame, child),
    renderContent(endpoint),
  )
}

/** Renders each slot endpoint into a map of React nodes. */
function renderSlots(route: string, frame: ComponentFrame): Record<string, ReactNode> {
  const slots: Record<string, ReactNode> = {}
  for (const [slotName, slotComponentTree] of Object.entries(frame.slots ?? {}))
    slots[slotName] = renderSlotChain(route, slotComponentTree.endpoint)
  return slots
}

/** Renders endpoint content with its frame chain, from inner to outer. */
function renderChain(route: string, endpoint: ComponentEndpoint): ReactNode {
  return endpoint.frames.reduceRight<ReactNode>(
    (child, frame) => wrapFrame(route, frame, child, frame.Layout && renderSlots(route, frame)),
    renderContent(endpoint),
  )
}

/** Resolves a route match into a React element tree. */
export function createRouteElement(route: string, routeMatcher: RouteMatcher, componentMap: ComponentMap): ReactNode {
  const routeMatch = routeMatcher(route)
  const componentTree = createComponentTree(routeMatch, componentMap)
  return renderChain(route, componentTree.endpoint)
}
