import type { ReactNode } from 'react'
import type { RouteMatcher, Params } from '@/pen-core'
import type { ComponentMap } from '@/pen-react/modules'
import type { ComponentFrame, ComponentMatch } from './component-tree'
import { AwaitComponent } from '@/lib/await-component'
import { DefaultBoundary } from '@/pen-react/modules/components/DefaultBoundary'
import { LoadingBoundary } from '@/pen-react/modules/components/LoadingBoundary'
import { ErrorBoundary } from '@/pen-react/modules/components/ErrorBoundary'
import { createComponentTree } from './component-tree'
import { pickRecord, sliceRecord } from '@/lib/record'

type ReactNodeMap = Record<string, ReactNode>

/** Wraps content with a frame's boundaries, layout, and slots. Every
 *  component is already resolved, so this is pure React tree assembly. */
function wrapFrame(url: string, frame: ComponentFrame, content: ReactNode, params: Params, slots?: ReactNodeMap): ReactNode {
  if (frame.default) {
    content = <DefaultBoundary Fallback={frame.default} pathname={url} params={params}>{content}</DefaultBoundary>
  }
  if (frame.loading) {
    content = <LoadingBoundary Fallback={frame.loading}>{content}</LoadingBoundary>
  }
  if (frame.error) {
    content = <ErrorBoundary Fallback={frame.error} pathname={url}>{content}</ErrorBoundary>
  }
  if (frame.layout) {
    const Layout = frame.layout
    content = <Layout params={params} {...slots}>{content}</Layout>
  }
  return content
}

/** Wraps endpoint content with its frame chain, from inner to outer. */
function renderChain(url: string, match: ComponentMatch, slotComponents: ReactNodeMap): ReactNode {
  const { endpoint, params } = match
  const Content = endpoint.content
  const contentProps = { params: sliceRecord(params, endpoint.paramCount) }

  const contentElement = Content.constructor.name === 'AsyncFunction'
    ? <AwaitComponent resolve={Content(contentProps) as Promise<ReactNode>} />
    : <Content {...contentProps} />

  return endpoint.frames.reduceRight<ReactNode>(
    (element, frame) => {
      const frameParams = sliceRecord(params, frame.paramCount)
      const frameSlots = frame.slotNames && pickRecord(slotComponents, frame.slotNames)
      const newFrame = wrapFrame(url, frame, element, frameParams, frameSlots)
      return newFrame
    },
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
export function createRouteElement(url: string, routeMatcher: RouteMatcher, components: ComponentMap): ReactNode {
  const routeMatch = routeMatcher(url)
  const mainMatch = createComponentTree(routeMatch, components)
  const slotComponents: ReactNodeMap = {}

  for (const [slotName, slotMatch] of Object.entries(mainMatch.slots ?? {}))
    slotComponents[slotName] = renderChain(url, slotMatch, {})
  return renderChain(url, mainMatch, slotComponents)
}
