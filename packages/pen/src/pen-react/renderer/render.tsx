import type { ReactNode } from 'react'
import type { Frame, Match, ParamEntries, PositionNode } from '@/pen-core'
import type { ComponentMap } from './types/component-map'
import type { Params } from './types/params'
import { use } from 'react'
import { isAsyncComponent } from './components/PageComponent'
import { DefaultBoundary } from './components/DefaultBoundary'
import { LoadingBoundary } from './components/LoadingBoundary'
import { ErrorBoundary } from './components/ErrorBoundary'

type SlotElements = Record<string, ReactNode>

/** Unwraps an async page's promise where the route's Suspense boundary can catch it. */
function AsyncContent({ promise }: { promise: Promise<ReactNode> }): ReactNode {
  return use(promise) // suspends here until a promise resolves
}

/** Returns params up to the given depth as an object. */
function sliceParams(params: ParamEntries, depth: number): Params {
  return Object.fromEntries(params.slice(0, depth))
}

/** Returns the rendered elements for the slots declared by a frame. */
function getSlotProps(slots: Frame<PositionNode>['slots'], slotElements: SlotElements): SlotElements {
  const slotProps: SlotElements = {}
  for (const name in slots)
    slotProps[name] = slotElements[name]
  return slotProps
}

/** Wraps content with a frame's boundaries, layout, and slots. The assertions are
 *  safe because frames and components come from the same createRouter() call. A
 *  missing component indicates a compiler bug. */
function wrapFrame(frame: Frame<PositionNode>, content: ReactNode, params: ParamEntries, slotElements: SlotElements, pathname: string, components: ComponentMap): ReactNode {
  const paramTable = sliceParams(params, frame.paramCount)

  if (frame.default) {
    const Fallback = components.default[frame.default]!
    content = <DefaultBoundary fallback={Fallback} params={paramTable}>{content}</DefaultBoundary>
  }
  if (frame.loading) {
    const Fallback = components.loading[frame.loading]!
    content = <LoadingBoundary fallback={Fallback}>{content}</LoadingBoundary>
  }
  if (frame.error) {
    const Fallback = components.error[frame.error]!
    content = <ErrorBoundary fallback={Fallback} pathname={pathname}>{content}</ErrorBoundary>
  }
  if (frame.layout) {
    const Layout = components.layout[frame.layout]!
    const slotProps = frame.slots ? getSlotProps(frame.slots, slotElements) : {}
    content = <Layout params={paramTable} {...slotProps}>{content}</Layout>
  }
  return content
}

/** Wraps endpoint content with its frame chain, from inner to outer. Component
 *  and frame assertions are safe for the same reason as in wrapFrame. Async
 *  pages are guaranteed to have a loading boundary by validation. */
function renderChain(match: Match, slotElements: SlotElements, pathname: string, components: ComponentMap): ReactNode {
  const { endpoint, params } = match
  const Content = (components.page[endpoint.contentPath] ?? components.default[endpoint.contentPath])!
  const contentParams = sliceParams(params, endpoint.paramCount)

  const contentElement: ReactNode = isAsyncComponent(Content)
    ? <AsyncContent promise={Content({ params: contentParams })} /> // every async page should have a loading boundary
    : <Content params={contentParams} />

  return endpoint.frames.reduceRight<ReactNode>(
    (element, frame) => wrapFrame(frame, element, params, slotElements, pathname, components),
    contentElement,
  )
}

/** Turns a router `Match` into a React element tree by rendering its slots
 *  and wrapping the main match with its frame chain.
 *
 *  @param mainMatch - The resolved route match to render.
 *  @param pathname - The path the match was produced from
 *  @param components - The component map used to resolve route modules.
 *  @returns The rendered React element tree. */
export function createMatchElement(mainMatch: Match, pathname: string, components: ComponentMap): ReactNode {
  const slotElements: SlotElements = {}

  for (const [slotName, slotMatch] of Object.entries(mainMatch.slots ?? {}))
    slotElements[slotName] = renderChain(slotMatch, {}, pathname, components)
  return renderChain(mainMatch, slotElements, pathname, components)
}
