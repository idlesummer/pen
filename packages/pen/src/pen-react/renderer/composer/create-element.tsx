import type { ReactNode } from 'react'
import type { RouteMatcher } from '@/pen-core'
import type { ComponentMap } from '@/pen-react/modules'
import type { ComponentFrame, ComponentTree } from './component-tree'
import { AwaitComponent } from '@/lib/await-component'
import { DefaultBoundary } from '@/pen-react/modules/components/DefaultBoundary'
import { LoadingBoundary } from '@/pen-react/modules/components/LoadingBoundary'
import { ErrorBoundary } from '@/pen-react/modules/components/ErrorBoundary'
import { createComponentTree } from './component-tree'

type ReactNodeMap = Record<string, ReactNode>

/** Renders endpoint content, awaiting async components when necessary. */
function renderContent(componentTree: ComponentTree): ReactNode {
  const { content: Content, params } = componentTree.endpoint
  const props = { params }
  return Content.constructor.name === 'AsyncFunction'
    ? <AwaitComponent resolve={Content(props) as Promise<ReactNode>} />
    : <Content {...props} />
}

/** Wraps child with a frame's default/loading/error boundaries. */
function wrapBoundaries(route: string, frame: ComponentFrame, child: ReactNode): ReactNode {
  if (frame.Default)
    child = <DefaultBoundary Fallback={frame.Default} route={route} params={frame.params}>{child}</DefaultBoundary>
  if (frame.Loading)
    child = <LoadingBoundary Fallback={frame.Loading}>{child}</LoadingBoundary>
  if (frame.Error)
    child = <ErrorBoundary Fallback={frame.Error} route={route}>{child}</ErrorBoundary>
  return child
}

/** Wraps child with a frame's boundaries and layout. */
function wrapFrame(route: string, frame: ComponentFrame, child: ReactNode, slots?: ReactNodeMap): ReactNode {
  const wrappedChild = wrapBoundaries(route, frame, child)
  return frame.Layout
    ? <frame.Layout params={frame.params} {...slots}>{wrappedChild}</frame.Layout>
    : wrappedChild
}

/** Renders a slot-owned tree's content with its frame chain, from inner to outer. */
function renderSlotChain(route: string, componentTree: ComponentTree): ReactNode {
  return componentTree.endpoint.frames.reduceRight<ReactNode>(
    (child, frame) => wrapFrame(route, frame, child),
    renderContent(componentTree),
  )
}

/** Renders each slot tree into a map of React nodes. */
function renderSlots(route: string, frame: ComponentFrame): ReactNodeMap {
  const slots: ReactNodeMap = {}
  for (const [slotName, slotComponentTree] of Object.entries(frame.slots ?? {}))
    slots[slotName] = renderSlotChain(route, slotComponentTree)
  return slots
}

/** Renders endpoint content with its frame chain, from inner to outer. */
function renderChain(route: string, componentTree: ComponentTree): ReactNode {
  return componentTree.endpoint.frames.reduceRight<ReactNode>(
    (child, frame) => wrapFrame(route, frame, child, frame.Layout && renderSlots(route, frame)),
    renderContent(componentTree),
  )
}

/** Resolves a route match into a React element tree, rendering the main frame
 *  chain and each frame's slots.
 *
 *  @param route - The route being rendered, passed through to boundaries.
 *  @param routeMatcher - Matches the route against the position tree.
 *  @param componentMap - The component map used to resolve path references.
 */
export function createRouteElement(route: string, routeMatcher: RouteMatcher, componentMap: ComponentMap): ReactNode {
  const routeMatch = routeMatcher(route)
  const componentTree = createComponentTree(routeMatch, componentMap)
  return renderChain(route, componentTree)
}
