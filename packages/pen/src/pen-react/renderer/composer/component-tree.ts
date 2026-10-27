import type { Match, MatchFrame, MatchEndpoint, Params } from '@/pen-core'
import type { ComponentMap } from '@/pen-react/modules'
import type { PageComponent } from '@/pen-react/modules/components/PageComponent'
import type { LayoutComponent } from '@/pen-react/modules/components/LayoutComponent'
import type { LoadingComponent } from '@/pen-react/modules/components/LoadingBoundary'
import type { ErrorComponent } from '@/pen-react/modules/components/ErrorBoundary'
import type { DefaultComponent } from '@/pen-react/modules/components/DefaultBoundary'

/** A frame with component references in place of component paths, carrying
 *  its own already-scoped params. Each declared slot's already-resolved
 *  match is converted right along with it. */
export type ComponentFrame = {
  Layout?: LayoutComponent
  Loading?: LoadingComponent
  Error?: ErrorComponent
  Default?: DefaultComponent
  slots?: Record<string, ComponentMatch>
  params: Params
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

/** Replaces a frame's component paths with their actual corresponding
 *  components - shared by both the main and leaf (slot-owned) conversions. */
function createFrameComponents(frame: MatchFrame, componentMap: ComponentMap): Omit<ComponentFrame, 'slots'> {
  return {
    Layout: frame.layout ? componentMap.layout[frame.layout] : undefined,
    Loading: frame.loading ? componentMap.loading[frame.loading] : undefined,
    Error: frame.error ? componentMap.error[frame.error] : undefined,
    Default: frame.default ? componentMap.default[frame.default] : undefined,
    params: frame.params,
  }
}

/** Converts a slot's own endpoint - its frames can never declare further
 *  slots, so this never needs to look for any. */
function createLeafComponentEndpoint(endpoint: MatchEndpoint, componentMap: ComponentMap): ComponentEndpoint {
  const frames = endpoint.frames.map(frame => createFrameComponents(frame, componentMap))
  const content = (componentMap.page[endpoint.contentPath] ?? componentMap.default[endpoint.contentPath])!
  return { frames, content, paramCount: endpoint.paramCount }
}

/** Converts a slot's own resolved match, preserving its params. */
function createLeafComponentMatch(match: Match, componentMap: ComponentMap): ComponentMatch {
  return { endpoint: createLeafComponentEndpoint(match.endpoint, componentMap), params: match.params }
}

/** Replaces a frame's component paths with their actual corresponding
 *  components, converting each of its already-resolved slot matches too. */
function createComponentFrame(frame: MatchFrame, componentMap: ComponentMap): ComponentFrame {
  const slots = frame.slots && Object.fromEntries(
    Object.entries(frame.slots).map(([name, match]) => [name, createLeafComponentMatch(match, componentMap)]),
  )
  return { ...createFrameComponents(frame, componentMap), slots }
}

/** Replaces an endpoint's content path and frame paths with their corresponding components. */
function createComponentEndpoint(endpoint: MatchEndpoint, componentMap: ComponentMap): ComponentEndpoint {
  const frames = endpoint.frames.map(frame => createComponentFrame(frame, componentMap))
  const content = (componentMap.page[endpoint.contentPath] ?? componentMap.default[endpoint.contentPath])!
  const paramCount = endpoint.paramCount
  return { frames, content, paramCount }
}

/** Converts a match into a component match, preserving its params. Each of
 *  its frames' own slot matches get converted along with it.
 *
 *  @param matchTree - The matched endpoint, with slot matches already resolved.
 *  @param componentMap - The component map used to resolve path references.
 *  @returns The component match with resolved components and preserved params. */
export function createComponentMatchTree(matchTree: Match, componentMap: ComponentMap): ComponentMatch {
  const endpoint = createComponentEndpoint(matchTree.endpoint, componentMap)
  const params = matchTree.params
  return { endpoint, params }
}
