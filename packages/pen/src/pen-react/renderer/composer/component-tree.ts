import type { Match, Frame, Endpoint, PositionNode, Params } from '@/pen-core'
import type { ComponentMap } from '@/pen-react/modules'
import type { PageComponent } from '@/pen-react/modules/components/PageComponent'
import type { LayoutComponent } from '@/pen-react/modules/components/LayoutComponent'
import type { LoadingComponent } from '@/pen-react/modules/components/LoadingBoundary'
import type { ErrorComponent } from '@/pen-react/modules/components/ErrorBoundary'
import type { DefaultComponent } from '@/pen-react/modules/components/DefaultBoundary'
import { traverse } from '@/lib/traverse'

/** A frame with component references in place of component paths. */
export type ComponentFrame = {
  Layout?: LayoutComponent
  Loading?: LoadingComponent
  Error?: ErrorComponent
  Default?: DefaultComponent
  slotNames?: string[]
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
  slots?: Record<string, ComponentMatch>
}

/** Replaces a frame's component paths with their actual corresponding components. */
function createComponentFrame(frame: Frame<PositionNode>, components: ComponentMap): ComponentFrame {
  return {
    Layout: frame.layout ? components.layout[frame.layout] : undefined,
    Loading: frame.loading ? components.loading[frame.loading] : undefined,
    Error: frame.error ? components.error[frame.error] : undefined,
    Default: frame.default ? components.default[frame.default] : undefined,
    slotNames: frame.slots ? Object.keys(frame.slots) : undefined,
    paramCount: frame.paramCount,
  }
}

/** Replaces an endpoint's content path and frame paths with their corresponding components. */
function createComponentEndpoint(endpoint: Endpoint<PositionNode>, components: ComponentMap): ComponentEndpoint {
  const frames = endpoint.frames.map(frame => createComponentFrame(frame, components))
  const content = (components.page[endpoint.contentPath] ?? components.default[endpoint.contentPath])!
  const paramCount = endpoint.paramCount
  return { frames, content, paramCount }
}

/** Converts a match into a component match, preserving its params. */
function createComponentMatch(match: Match, components: ComponentMap): ComponentMatch {
  const endpoint = createComponentEndpoint(match.endpoint, components)
  const params = match.params
  return { endpoint, params }
}

/** Converts a route match tree's component paths into component references for the renderer.
 *
 *  @param match - The matched endpoint and its nested slot matches.
 *  @param components - The component map used to resolve endpoints.
 *  @returns The component match with resolved components and preserved params. */
export function createComponentTree(rootMatch: Match, componentMap: ComponentMap): ComponentMatch {
  const rootComponentMatch = createComponentMatch(rootMatch, componentMap)
  const componentMatchOf = new Map([[rootMatch, rootComponentMatch]])

  traverse(rootMatch, {
    expand: (node) => node.slots ? Object.values(node.slots) : [],
    attach: (child, parent) => {
      const componentMatch = createComponentMatch(child, componentMap)
      componentMatchOf.set(child, componentMatch)

      const parentComponentMatch = componentMatchOf.get(parent)!
      parentComponentMatch.slots ??= {}
      parentComponentMatch.slots[child.name] = componentMatch
    },
  })
  return rootComponentMatch
}
