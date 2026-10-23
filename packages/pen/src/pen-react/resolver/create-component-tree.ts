import type { Match, Frame, Endpoint, PositionNode, Params } from '@/pen-core'
import type { ComponentMap } from '@/pen-react/modules'
import type { PageComponent, DefaultComponent, LayoutComponent, LoadingComponent, ErrorComponent } from '@/pen-react/render'
import { traverse } from '@/lib/traverse'

/** A frame with every path reference already resolved to a component. */
export type ComponentFrame = {
  layout?: LayoutComponent
  loading?: LoadingComponent
  error?: ErrorComponent
  default?: DefaultComponent
  slotNames?: string[]
  paramCount: number
}

/** An endpoint with its content and frame chain already resolved. */
export type ComponentEndpoint = {
  frames: ComponentFrame[]
  content: PageComponent | DefaultComponent
  paramCount: number
}

/** A route match with every path reference resolved into a real component -
 *  everything the renderer needs to build a React tree, and nothing else. */
export type ComponentMatch = {
  endpoint: ComponentEndpoint
  params: Params
  slots?: Record<string, ComponentMatch>
}

// Turns a Match's path strings into the actual components the renderer
// needs, so the renderer itself never has to know a component map exists.

/** Replaces a frame's component paths with their actual corresponding components. */
function createComponentFrame(frame: Frame<PositionNode>, components: ComponentMap): ComponentFrame {
  return {
    layout: frame.layout ? components.layout[frame.layout] : undefined,
    loading: frame.loading ? components.loading[frame.loading] : undefined,
    error: frame.error ? components.error[frame.error] : undefined,
    default: frame.default ? components.default[frame.default] : undefined,
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

/** Converts a match tree's component paths into component references for the renderer.
 *
 *  @param match - The matched endpoint and its nested slot matches.
 *  @param components - The component map used to resolve endpoints.
 *  @returns The component match with resolved components and preserved params. */
export function createComponentTree(match: Match, components: ComponentMap): ComponentMatch {
  const rootComponentMatch = createComponentMatch(match, components)
  const componentMatchOf = new Map([[match, rootComponentMatch]])

  traverse(match, {
    expand: (node) => node.slots ? Object.values(node.slots) : [],
    attach: (child, parent) => {
      const componentMatch = createComponentMatch(child, components)
      componentMatchOf.set(child, componentMatch)

      const parentComponentMatch = componentMatchOf.get(parent)!
      parentComponentMatch.slots ??= {}
      parentComponentMatch.slots[child.name] = componentMatch
    },
  })
  return rootComponentMatch
}
