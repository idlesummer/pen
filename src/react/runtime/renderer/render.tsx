import type { ReactNode } from 'react'
import type { Endpoint, Frame, MatchNode, Params } from '@/router'
import type { ParamTable } from '../module-components/ParamTable'
import type { ComponentMap } from './component-map'
import { resolveComponent, resolveContent } from './component-map'
import { ErrorBoundary } from '../module-components/ErrorBoundary'
import { DefaultBoundary } from '../module-components/DefaultBoundary'
import { LoadingBoundary } from '../module-components/LoadingBoundary'

type SlotElements = Record<string, ReactNode>

/** Returns params up to the given depth as an object. */
function sliceParams(params: Params, depth: number): ParamTable {
  return Object.fromEntries(params.slice(0, depth))
}

/** Wraps content with a frame's boundaries, layout, and slots. */
function wrapFrame(frame: Frame, content: ReactNode, params: Params, slotElements: SlotElements, componentMap: ComponentMap): ReactNode {
  const { layout, loading, error, default: defaultPath, slots, paramDepth } = frame

  if (defaultPath) {
    const Fallback = resolveComponent('default', defaultPath, componentMap)
    content = <DefaultBoundary fallback={Fallback}>{content}</DefaultBoundary>
  }
  if (error) {
    const Fallback = resolveComponent('error', error, componentMap)
    content = <ErrorBoundary fallback={Fallback}>{content}</ErrorBoundary>
  }
  if (loading) {
    const Loading = resolveComponent('loading', loading, componentMap)
    content = <LoadingBoundary fallback={Loading}>{content}</LoadingBoundary>
  }
  if (layout) {
    const Layout = resolveComponent('layout', layout, componentMap)
    const slotProps: Record<string, ReactNode> = {}
    for (const name in slots) // doesn't run if slots is undefined
      slotProps[name] = slotElements[name]

    const paramTable = sliceParams(params, paramDepth)
    content = <Layout params={paramTable} {...slotProps}>{content}</Layout>
  }
  return content
}

/** Folds one endpoint's frame chain (outermost first) around its content,
 *  given every slot its frames declare already rendered. Never calls
 *  itself - a slot's own frames can never declare a further slot, so
 *  `renderChain` called on a slot's endpoint passes an empty `slotElements`
 *  and that's the end of it. */
function renderChain(endpoint: Endpoint, params: Params, slotElements: SlotElements, componentMap: ComponentMap): ReactNode {
  const Content = resolveContent(endpoint.content, componentMap)
  let element: ReactNode = <Content params={sliceParams(params, endpoint.contentDepth)} />

  for (let i = endpoint.frames.length-1; i >= 0; i--)
    element = wrapFrame(endpoint.frames[i]!, element, params, slotElements, componentMap)
  return element
}

/** Turns a router `MatchNode` into a React element tree: renders every slot
 *  its frames declare first - each fully independent, no further slots
 *  possible - then folds the main chain around them. */
export function renderNode(node: MatchNode, componentMap: ComponentMap): ReactNode {
  const slotElements: SlotElements = {}
  for (const frame of node.endpoint.frames) {
    if (!frame.slots) continue
    for (const name in frame.slots) {
      const slotNode = node.slots![name]!
      slotElements[name] = renderChain(slotNode.endpoint, slotNode.params, {}, componentMap)
    }
  }
  return renderChain(node.endpoint, node.params, slotElements, componentMap)
}
