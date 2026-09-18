import type { ReactNode } from 'react'
import type { Endpoint, Frame, MatchNode, ParamTable } from '@/router'
import type { ComponentMap } from './component-map'
import type { ErrorFallbackProps } from '../boundaries/ErrorBoundary'
import { Suspense } from 'react'
import { resolveComponent } from './component-map'
import { ErrorBoundary } from '../boundaries/ErrorBoundary'
import { DefaultBoundary } from '../boundaries/DefaultBoundary'

/** Slices a param table down to the first `depth` bindings - ParamTable is
 *  already in bind order, so that's just the first `depth` entries - and
 *  builds the keyed object a component actually reads `params.id` off of.
 *  The only place that object gets built: everywhere upstream just appends
 *  and slices entries, never needing a key lookup. */
function paramsUpTo(params: ParamTable, depth: number): Record<string, string | string[]> {
  return Object.fromEntries(params.slice(0, depth))
}

/** Wraps already-resolved `content` in whichever of a frame's default/error/
 *  loading/layout modules are present, injecting this frame's own declared
 *  slots - already rendered, looked up by name - into its layout. The one
 *  place this composition happens, shared by the main chain and every slot's
 *  own chain alike. */
function wrapFrame(frame: Frame, content: ReactNode, params: ParamTable, slotElements: Record<string, ReactNode>, componentMap: ComponentMap): ReactNode {
  const { layout, loading, error, default: defaultPath, slots, paramDepth } = frame

  if (defaultPath) {
    const Fallback = resolveComponent(defaultPath, componentMap)
    content = <DefaultBoundary fallback={Fallback}>{content}</DefaultBoundary>
  }
  if (error) {
    const Fallback = resolveComponent<ErrorFallbackProps>(error, componentMap)
    content = <ErrorBoundary fallback={Fallback}>{content}</ErrorBoundary>
  }
  if (loading) {
    const Loading = resolveComponent(loading, componentMap)
    content = <Suspense fallback={<Loading />}>{content}</Suspense>
  }
  if (layout) {
    const Layout = resolveComponent(layout, componentMap)
    const namedSlots: Record<string, ReactNode> = {}
    if (slots)
      for (const name of Object.keys(slots))
        namedSlots[name] = slotElements[name]
    content = <Layout params={paramsUpTo(params, paramDepth)} {...namedSlots}>{content}</Layout>
  }
  return content
}

/** Folds one endpoint's frame chain (outermost first) around its content,
 *  given every slot its frames declare already rendered. Never calls
 *  itself - a slot's own frames can never declare a further slot, so
 *  `renderChain` called on a slot's endpoint passes an empty `slotElements`
 *  and that's the end of it. */
function renderChain(endpoint: Endpoint, params: ParamTable, slotElements: Record<string, ReactNode>, componentMap: ComponentMap): ReactNode {
  const Content = resolveComponent(endpoint.content, componentMap)
  let element: ReactNode = <Content params={paramsUpTo(params, endpoint.contentDepth)} />

  for (let i = endpoint.frames.length-1; i >= 0; i--)
    element = wrapFrame(endpoint.frames[i]!, element, params, slotElements, componentMap)

  return element
}

/** Turns a router `MatchNode` into a React element tree: renders every slot
 *  its frames declare first - each fully independent, no further slots
 *  possible - then folds the main chain around them. */
export function renderNode(node: MatchNode, componentMap: ComponentMap): ReactNode {
  const slotElements: Record<string, ReactNode> = {}
  for (const frame of node.endpoint.frames) {
    if (!frame.slots) continue
    for (const name in frame.slots) {
      const slotNode = node.slots![name]!
      slotElements[name] = renderChain(slotNode.endpoint, slotNode.params, {}, componentMap)
    }
  }
  return renderChain(node.endpoint, node.params, slotElements, componentMap)
}
