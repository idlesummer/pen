import type { ReactNode } from 'react'
import type { Frame, Match, Params } from '@/pen-core'
import type { ComponentMap } from './component-map'
import type { ParamTable } from './components/ParamTable'
import { use } from 'react'
import { isAsyncComponent } from './components/PageComponent'
import { DefaultBoundary } from './components/DefaultBoundary'
import { LoadingBoundary } from './components/LoadingBoundary'
import { ErrorBoundary } from './components/ErrorBoundary'

type SlotElements = Record<string, ReactNode>

/** Unwraps an async page's promise where the route's Suspense boundary can catch it. */
function AsyncContent({ promise }: { promise: Promise<ReactNode> }): ReactNode {
  return use(promise)
}

/** Returns params up to the given depth as an object. */
function sliceParams(params: Params, depth: number): ParamTable {
  return Object.fromEntries(params.slice(0, depth))
}

/** Returns the rendered elements for the slots declared by a frame. */
function getSlotProps(slots: Frame['slots'], slotElements: SlotElements): SlotElements {
  const slotProps: SlotElements = {}
  for (const name in slots)
    slotProps[name] = slotElements[name]
  return slotProps
}

/** Wraps content with a frame's boundaries, layout, and slots. The assertions are
 *  safe since frames and components should come from the same createRouter() call.
 *  A missing component means there is a compiler bug, not stale data. */
function wrapFrame(frame: Frame, content: ReactNode, params: Params, slotElements: SlotElements, components: ComponentMap, pathname: string): ReactNode {
  const { layout, loading, error, default: _default, slots, paramDepth } = frame

  if (_default) {
    const Fallback = components.default[_default]!
    content = <DefaultBoundary fallback={Fallback}>{content}</DefaultBoundary>
  }
  if (loading) {
    const Fallback = components.loading[loading]!
    content = <LoadingBoundary fallback={Fallback}>{content}</LoadingBoundary>
  }
  if (error) {
    const Fallback = components.error[error]!
    content = <ErrorBoundary fallback={Fallback} pathname={pathname}>{content}</ErrorBoundary>
  }
  if (layout) {
    const Layout = components.layout[layout]!
    const slotProps = slots ? getSlotProps(slots, slotElements) : {}
    const paramTable = sliceParams(params, paramDepth)
    content = <Layout params={paramTable} {...slotProps}>{content}</Layout>
  }
  return content
}

/** Wraps endpoint content with its frame chain, from inner to outer. */
function renderChain(match: Match, slotElements: SlotElements, components: ComponentMap): ReactNode {
  const { endpoint, params, pathname } = match
  const Content = (components.page[endpoint.content] ?? components.default[endpoint.content])! // same invariant as wrapFrame
  const contentParams = sliceParams(params, endpoint.contentDepth)

  let element: ReactNode = isAsyncComponent(Content)
    ? <AsyncContent promise={Content({ params: contentParams })} /> // validateModules ensures every async page has a loading boundary
    : <Content params={contentParams} />

  for (let i = endpoint.frames.length-1; i >= 0; i--) {
    const frame = endpoint.frames[i]!
    element = wrapFrame(frame, element, params, slotElements, components, pathname)
  }
  return element
}

/** Turns a router `Match` into a React element tree by rendering its slots
 *  and wrapping the main match with its frame chain.
 *
 *  @param mainMatch - The resolved route match to render.
 *  @param components - The component map used to resolve route modules.
 *  @returns The rendered React element tree. */
export function renderMatch(mainMatch: Match, components: ComponentMap): ReactNode {
  const slotElements: SlotElements = {}

  for (const [slotName, slotMatch] of Object.entries(mainMatch.slots ?? {}))
    slotElements[slotName] = renderChain(slotMatch, {}, components)
  return renderChain(mainMatch, slotElements, components)
}
