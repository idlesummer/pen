import type { ReactNode } from 'react'
import type { Frame, Match, Params } from '@/router'
import type { ParamTable } from './module-components/ParamTable'
import type { ComponentMap } from './component-map'
import { resolveComponent, resolveContent } from './component-map'
import { ErrorBoundary } from './module-components/ErrorBoundary'
import { DefaultBoundary } from './module-components/DefaultBoundary'
import { LoadingBoundary } from './module-components/LoadingBoundary'

type SlotElements = Record<string, ReactNode>

/** Returns params up to the given depth as an object. */
function sliceParams(params: Params, depth: number): ParamTable {
  return Object.fromEntries(params.slice(0, depth))
}

/** Returns the rendered elements for the slots declared by a frame. */
function getSlotProps(slotElements: SlotElements, slots?: Frame['slots']): SlotElements {
  const slotProps: SlotElements = {}
  for (const name in slots)
    slotProps[name] = slotElements[name]
  return slotProps
}

/** Wraps content with a frame's boundaries, layout, and slots. */
function renderFrame(frame: Frame, content: ReactNode, params: Params, slotElements: SlotElements, components: ComponentMap): ReactNode {
  const { layout, loading, error, default: _default, slots, paramDepth } = frame

  if (_default) {
    const Fallback = resolveComponent('default', _default, components)
    content = <DefaultBoundary fallback={Fallback}>{content}</DefaultBoundary>
  }
  if (error) {
    const Fallback = resolveComponent('error', error, components)
    content = <ErrorBoundary fallback={Fallback}>{content}</ErrorBoundary>
  }
  if (loading) {
    const Loading = resolveComponent('loading', loading, components)
    content = <LoadingBoundary fallback={Loading}>{content}</LoadingBoundary>
  }
  if (layout) {
    const Layout = resolveComponent('layout', layout, components)
    const slotProps = getSlotProps(slotElements, slots)
    const paramTable = sliceParams(params, paramDepth)
    content = <Layout params={paramTable} {...slotProps}>{content}</Layout>
  }
  return content
}

/** Wraps endpoint content with its frame chain, from inner to outer. */
function renderChain(match: Match, slotElements: SlotElements, components: ComponentMap): ReactNode {
  const { endpoint, params } = match
  const Content = resolveContent(endpoint.content, components)
  let element: ReactNode = <Content params={sliceParams(params, endpoint.contentDepth)} />

  for (let i = endpoint.frames.length-1; i >= 0; i--) {
    const frame = endpoint.frames[i]!
    element = renderFrame(frame, element, params, slotElements, components)
  }
  return element
}

/** Turns a router `Match` into a React element tree: renders every slot
 *  match() already resolved first - each fully independent, no further slots
 *  possible - then folds the main chain around them. */
export function renderMatch(mainMatch: Match, components: ComponentMap): ReactNode {
  const slotElements: SlotElements = {}
  for (const [slotName, slotMatch] of Object.entries(mainMatch.slots ?? {}))
    slotElements[slotName] = renderChain(slotMatch, {}, components)

  return renderChain(mainMatch, slotElements, components)
}
