import type { ReactNode } from 'react'
import type { ParamEntries } from '@/pen-core'
import type { ResolvedFrame, ResolvedMatch } from './types/resolved-match'
import type { Params } from './types/params'
import { AwaitComponent } from '@/lib/await-component'
import { DefaultBoundary } from './components/DefaultBoundary'
import { LoadingBoundary } from './components/LoadingBoundary'
import { ErrorBoundary } from './components/ErrorBoundary'

type SlotElements = Record<string, ReactNode>

/** Returns params up to the given depth as an object. */
function sliceParams(params: ParamEntries, depth: number): Params {
  return Object.fromEntries(params.slice(0, depth))
}

/** Picks out the rendered elements for the slots a frame declares. */
function getSlotProps(slotNames: string[], slotElements: SlotElements): SlotElements {
  const slotProps: SlotElements = {}
  for (const name of slotNames)
    slotProps[name] = slotElements[name]
  return slotProps
}

/** Wraps content with a frame's boundaries, layout, and slots. Every
 *  component is already resolved, so this is pure React tree assembly. */
function wrapFrame(frame: ResolvedFrame, content: ReactNode, params: ParamEntries, slotElements: SlotElements, pathname: string): ReactNode {
  const paramTable = sliceParams(params, frame.paramCount)

  if (frame.default) {
    content = <DefaultBoundary Fallback={frame.default} pathname={pathname} params={paramTable}>{content}</DefaultBoundary>
  }
  if (frame.loading) {
    content = <LoadingBoundary Fallback={frame.loading}>{content}</LoadingBoundary>
  }
  if (frame.error) {
    content = <ErrorBoundary Fallback={frame.error} pathname={pathname}>{content}</ErrorBoundary>
  }
  if (frame.layout) {
    const Layout = frame.layout
    const slotProps = frame.slots ? getSlotProps(frame.slots, slotElements) : {}
    content = <Layout params={paramTable} {...slotProps}>{content}</Layout>
  }
  return content
}

/** Wraps endpoint content with its frame chain, from inner to outer. */
function renderChain(match: ResolvedMatch, slotElements: SlotElements, pathname: string): ReactNode {
  const { endpoint, params } = match
  const Content = endpoint.content
  const contentProps = { params: sliceParams(params, endpoint.paramCount) }

  const contentElement = Content.constructor.name === 'AsyncFunction'
    ? <AwaitComponent resolve={Content(contentProps) as Promise<ReactNode>} />
    : <Content {...contentProps} />

  return endpoint.frames.reduceRight<ReactNode>(
    (element, frame) => wrapFrame(frame, element, params, slotElements, pathname),
    contentElement,
  )
}

/** Turns a resolved route match into a React element tree, rendering its
 *  slots first and wrapping the main match with its own frame chain. */
export function createRouteElement(mainMatch: ResolvedMatch, pathname: string): ReactNode {
  const slotElements: SlotElements = {}

  for (const [slotName, slotMatch] of Object.entries(mainMatch.slots ?? {}))
    slotElements[slotName] = renderChain(slotMatch, {}, pathname)
  return renderChain(mainMatch, slotElements, pathname)
}
