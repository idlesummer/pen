import type { ReactNode } from 'react'
import type { Endpoint, Frame, Match, Params } from '@/router'
import type { ComponentMap, RouteComponent } from './component-map'
import type { ParamTable } from './route-modules/ParamTable'
import type { AsyncPageComponent } from './route-modules/PageComponent'
import { use } from 'react'
import { resolveComponent, resolveContent } from './component-map'
import { DefaultBoundary } from './route-modules/DefaultBoundary'
import { LoadingBoundary } from './route-modules/LoadingBoundary'
import { ErrorBoundary } from './route-modules/ErrorBoundary'

type SlotElements = Record<string, ReactNode>

/** Async pages are declared with `async`, so they're distinguishable before
 *  being called - which matters, since a sync page can't be called outside
 *  React without breaking its hooks. Takes any RouteComponent, not just a
 *  page, since validateAsyncPages checks entries from a map spanning every
 *  role - the check itself is generic, just a constructor name. */
function isAsyncComponent(Content: RouteComponent): Content is AsyncPageComponent {
  return Content.constructor.name === 'AsyncFunction'
}

/** Unwraps an async page's promise where the route's Suspense boundary can
 *  catch it. The promise is created by renderChain, above the boundary, so
 *  the same one comes back on every retry - creating it here instead would
 *  make a new promise per retry and never settle. */
function AsyncContent({ promise }: { promise: Promise<ReactNode> }): ReactNode {
  return use(promise)
}

/** Fails fast, once, for every async page whose frame chain has no
 *  loading.tsx to suspend into - checked eagerly against every route the
 *  app can render, not reactively on whichever one a user happens to visit
 *  first, so a misconfigured page can't ship silently. Keeps renderChain
 *  itself free of validation concerns; it can assume every async page it
 *  encounters is already known-good. */
export function validateAsyncPages(pageEndpoints: Endpoint[], componentsByPath: Map<string, RouteComponent>): void {
  const broken = pageEndpoints.filter((endpoint) => {
    const Content = componentsByPath.get(endpoint.content)! // Safe - every real page endpoint has a discovered component
    return isAsyncComponent(Content) && !endpoint.frames.some(frame => frame.loading)
  })
  if (broken.length > 0) {
    const messages = broken.map(endpoint => `"${endpoint.content}" is an async page, so its route needs a loading.tsx to suspend into.`)
    throw new Error(messages.join('\n'))
  }
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
  let element: ReactNode = isAsyncComponent(Content)
    ? <AsyncContent promise={Content({ params: contentParams })} /> // validateAsyncPages ensures every async page has a loading boundary
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
