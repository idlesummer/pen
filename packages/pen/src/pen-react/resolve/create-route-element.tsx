import type { ReactNode } from 'react'
import type { Match, Params } from '@/pen-core'
import type { ComponentMap } from '@/pen-react/modules'
import type { ComponentFrame, ComponentMatch } from './create-component-tree'
import { AwaitComponent } from '@/lib/await-component'
import { DefaultBoundary, LoadingBoundary, ErrorBoundary } from '@/pen-react/render'
import { createComponentTree } from './create-component-tree'

type ReactNodeMap = Record<string, ReactNode>

/** Returns params up to the given bind depth as an object. */
function sliceParams(params: Params, depth: number): Params {
  return Object.fromEntries(Object.entries(params).slice(0, depth))
}

/** Picks out the rendered elements for the slots a frame declares. */
function getSlotProps(slotNames: string[], slotComponents: ReactNodeMap): ReactNodeMap {
  const slotProps: ReactNodeMap = {}
  for (const name of slotNames)
    slotProps[name] = slotComponents[name]
  return slotProps
}

/** Wraps content with a frame's boundaries, layout, and slots. Every
 *  component is already resolved, so this is pure React tree assembly. */
function wrapFrame(frame: ComponentFrame, content: ReactNode, params: Params, slotComponents: ReactNodeMap, pathname: string): ReactNode {
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
    const slotProps = frame.slots ? getSlotProps(frame.slots, slotComponents) : {}
    content = <Layout params={paramTable} {...slotProps}>{content}</Layout>
  }
  return content
}

/** Wraps endpoint content with its frame chain, from inner to outer. */
function renderChain(match: ComponentMatch, slotComponents: ReactNodeMap, pathname: string): ReactNode {
  const { endpoint, params } = match
  const Content = endpoint.content
  const contentProps = { params: sliceParams(params, endpoint.paramCount) }

  const contentElement = Content.constructor.name === 'AsyncFunction'
    ? <AwaitComponent resolve={Content(contentProps) as Promise<ReactNode>} />
    : <Content {...contentProps} />

  return endpoint.frames.reduceRight<ReactNode>(
    (element, frame) => wrapFrame(frame, element, params, slotComponents, pathname),
    contentElement,
  )
}

/** Resolves a match against the component map and turns it into a React
 *  element tree, rendering its slots first and wrapping the main match
 *  with its own frame chain.
 *
 *  @param match - The matched endpoint and its nested slot matches.
 *  @param components - The component map used to resolve path references.
 *  @param pathname - The pathname being rendered, passed through to boundaries. */
export function createRouteElement(match: Match, components: ComponentMap, pathname: string): ReactNode {
  const mainMatch = createComponentTree(match, components)
  const slotComponents: ReactNodeMap = {}

  for (const [slotName, slotMatch] of Object.entries(mainMatch.slots ?? {}))
    slotComponents[slotName] = renderChain(slotMatch, {}, pathname)
  return renderChain(mainMatch, slotComponents, pathname)
}
