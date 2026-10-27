import type { Match, MatchFrame, MatchEndpoint, Params } from '@/pen-core'
import type { ComponentMap } from '@/pen-react/modules'
import type { PageComponent } from '@/pen-react/modules/components/PageComponent'
import type { LayoutComponent } from '@/pen-react/modules/components/LayoutComponent'
import type { LoadingComponent } from '@/pen-react/modules/components/LoadingBoundary'
import type { ErrorComponent } from '@/pen-react/modules/components/ErrorBoundary'
import type { DefaultComponent } from '@/pen-react/modules/components/DefaultBoundary'
import { traverse } from '@/lib/traverse'

/** A frame with component references in place of component paths. `slots`
 *  keys are known upfront; their resolved matches get filled in by
 *  createComponentMatchTree's traversal. */
export type ComponentFrame = {
  Layout?: LayoutComponent
  Loading?: LoadingComponent
  Error?: ErrorComponent
  Default?: DefaultComponent
  slots?: Record<string, ComponentMatch>
  paramCount: number
}

/** An endpoint with its content and frames converted to components. */
export type ComponentEndpoint = {
  frames: ComponentFrame[]
  content: PageComponent | DefaultComponent
  paramCount: number
}

/** A match tree with component references in place of component paths. */
export type ComponentMatch = {
  endpoint: ComponentEndpoint
  params: Params
}

/** Replaces a frame's component paths with their actual corresponding components.
 *  Slot values start undefined - createComponentMatchTree fills them in once
 *  it resolves each slot's own match. */
function createComponentFrame(frame: MatchFrame, components: ComponentMap): ComponentFrame {
  const slots = frame.slots && Object.fromEntries(
    frame.slots.map(name => [name, undefined as unknown as ComponentMatch]),
  )
  return {
    Layout: frame.layout ? components.layout[frame.layout] : undefined,
    Loading: frame.loading ? components.loading[frame.loading] : undefined,
    Error: frame.error ? components.error[frame.error] : undefined,
    Default: frame.default ? components.default[frame.default] : undefined,
    slots,
    paramCount: frame.paramCount,
  }
}

/** Replaces an endpoint's content path and frame paths with their corresponding components. */
function createComponentEndpoint(endpoint: MatchEndpoint, componentMap: ComponentMap): ComponentEndpoint {
  const frames = endpoint.frames.map(frame => createComponentFrame(frame, componentMap))
  const content = (componentMap.page[endpoint.contentPath] ?? componentMap.default[endpoint.contentPath])!
  const paramCount = endpoint.paramCount
  return { frames, content, paramCount }
}

/** Converts a match into a component match, preserving its params. */
function createComponentMatch(match: Match, componentMap: ComponentMap): ComponentMatch {
  const endpoint = createComponentEndpoint(match.endpoint, componentMap)
  const params = match.params
  return { endpoint, params }
}

/** Converts a route match tree's component paths into component references for the renderer.
 *  Each slot's resolved match is attached directly to the frame that declared it, so
 *  rendering never needs a separately-threaded map to look slots up by name.
 *
 *  @param rootMatch - The matched endpoint and its nested slot matches.
 *  @param componentMap - The component map used to resolve endpoints.
 *  @returns The component match with resolved components and preserved params. */
export function createComponentMatchTree(matchTree: Match, componentMap: ComponentMap): ComponentMatch {
  const componentMatchTree = createComponentMatch(matchTree, componentMap)
  const componentMatchOf = new Map([[matchTree, componentMatchTree]])

  traverse(matchTree, {
    expand: (node) => node.slots ? Object.values(node.slots) : [],
    attach: (child, parent) => {
      const componentMatch = createComponentMatch(child, componentMap)
      componentMatchOf.set(child, componentMatch)

      const parentComponentMatch = componentMatchOf.get(parent)!
      const ownerFrame = parentComponentMatch.endpoint.frames.find(frame => frame.slots && child.name in frame.slots)!
      ownerFrame.slots![child.name] = componentMatch
    },
  })
  return componentMatchTree
}
