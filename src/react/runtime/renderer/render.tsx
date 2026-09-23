import type { ReactNode } from 'react'
import type { Frame, Match, Params } from '@/router'
import type { ComponentMap } from './component-map'
import type { ParamTable } from './route-modules/ParamTable'
import { use } from 'react'
import { resolveComponent, resolveContent } from './component-map'
import { isAsyncComponent } from './route-modules/PageComponent'
import { DefaultBoundary } from './route-modules/DefaultBoundary'
import { LoadingBoundary } from './route-modules/LoadingBoundary'
import { ErrorBoundary } from './route-modules/ErrorBoundary'

type SlotElements = Record<string, ReactNode>

/** Unwraps an async page's promise where the route's Suspense boundary can
 *  catch it. The promise is created by renderChain, above the boundary, so
 *  the same one comes back on every retry - creating it here instead would
 *  make a new promise per retry and never settle. */
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

/** Wraps content with a frame's boundaries, layout, and slots. Boundary
 *  order matches Next.js's own hierarchy: layout, then error, then loading,
 *  then the not-found/default fallback closest to the content - so error
 *  stays the outermost net, able to catch a throw from loading's own
 *  fallback, not just from the content it wraps. */
function wrapFrame(frame: Frame, content: ReactNode, params: Params, slotElements: SlotElements, components: ComponentMap, pathname: string): ReactNode {
  const { layout, loading, error, default: _default, slots, paramDepth } = frame

  if (_default) {
    const Fallback = resolveComponent('default', _default, components)
    content = <DefaultBoundary fallback={Fallback}>{content}</DefaultBoundary>
  }
  if (loading) {
    const Fallback = resolveComponent('loading', loading, components)
    content = <LoadingBoundary fallback={Fallback}>{content}</LoadingBoundary>
  }
  if (error) {
    const Fallback = resolveComponent('error', error, components)
    content = <ErrorBoundary fallback={Fallback} pathname={pathname}>{content}</ErrorBoundary>
  }
  if (layout) {
    const Layout = resolveComponent('layout', layout, components)
    const slotProps = slots ? getSlotProps(slots, slotElements) : {}
    const paramTable = sliceParams(params, paramDepth)
    content = <Layout params={paramTable} {...slotProps}>{content}</Layout>
  }
  return content
}

/** Wraps endpoint content with its frame chain, from inner to outer. */
function renderChain(match: Match, slotElements: SlotElements, components: ComponentMap): ReactNode {
  const { endpoint, params, pathname } = match
  const Content = resolveContent(endpoint.content, components)
  const contentParams = sliceParams(params, endpoint.contentDepth)
  let element: ReactNode

  if (isAsyncComponent(Content)) {
    // Safe to assume a loading.tsx exists somewhere in the frame chain -
    // validateModules checks every async page for this eagerly, before
    // any of them ever render.
    element = <AsyncContent promise={Content({ params: contentParams })} />
  }
  else {
    element = <Content params={contentParams} />
  }
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
