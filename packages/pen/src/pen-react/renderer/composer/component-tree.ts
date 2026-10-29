import type { Match, MatchFrame, MatchParams } from '@/pen-core'
import type { ComponentMap } from '@/pen-react/modules'
import type { PageComponent } from '@/pen-react/modules/components/PageComponent'
import type { LayoutComponent } from '@/pen-react/modules/components/LayoutComponent'
import type { LoadingComponent } from '@/pen-react/modules/components/LoadingBoundary'
import type { ErrorComponent } from '@/pen-react/modules/components/ErrorBoundary'
import type { DefaultComponent } from '@/pen-react/modules/components/DefaultBoundary'

/** A frame with component references in place of component paths, carrying
 *  its own already-scoped params and each declared slot's own converted tree. */
export type ComponentFrame = {
  Layout?: LayoutComponent
  Loading?: LoadingComponent
  Error?: ErrorComponent
  Default?: DefaultComponent
  slots?: Record<string, ComponentTree>
  params: MatchParams
}

/** An endpoint with its content and frames converted to components. */
export type ComponentEndpoint = {
  frames: ComponentFrame[]
  content: PageComponent | DefaultComponent
  params: MatchParams
}

/** A matched endpoint with component references, with every declared slot already converted. */
export type ComponentTree = {
  endpoint: ComponentEndpoint
}

/** Converts a frame's component paths into their actual components. */
function createFrameComponents(frame: MatchFrame, componentMap: ComponentMap): Omit<ComponentFrame, 'slots'> {
  return {
    Layout: frame.layout ? componentMap.layout[frame.layout] : undefined,
    Loading: frame.loading ? componentMap.loading[frame.loading] : undefined,
    Error: frame.error ? componentMap.error[frame.error] : undefined,
    Default: frame.default ? componentMap.default[frame.default] : undefined,
    params: frame.params,
  }
}

/** Converts a slot's own resolved match. Its frames can never declare further slots. */
function createComponentSlot(slotMatch: Match, componentMap: ComponentMap): ComponentTree {
  const slotEndpoint = slotMatch.endpoint
  const frames = slotEndpoint.frames.map(frame => createFrameComponents(frame, componentMap))
  const content = (componentMap.page[slotEndpoint.contentPath] ?? componentMap.default[slotEndpoint.contentPath])!
  const endpoint = { frames, content, params: slotEndpoint.params }
  return { endpoint }
}

/** Converts a match into a component tree and resolves its frames' declared slots. */
export function createComponentTree(matchTree: Match, componentMap: ComponentMap): ComponentTree {
  const mainEndpoint = matchTree.endpoint
  const frames = mainEndpoint.frames.map((frame) => {
    const slots: Record<string, ComponentTree> = {}

    for (const [slotName, slotMatch] of Object.entries(frame.slots ?? {})) {
      const componentSlot = createComponentSlot(slotMatch, componentMap)
      slots[slotName] = componentSlot
    }
    return { ...createFrameComponents(frame, componentMap), slots }
  })
  const content = (componentMap.page[mainEndpoint.contentPath] ?? componentMap.default[mainEndpoint.contentPath])!
  const endpoint = { frames, content, params: mainEndpoint.params }
  return { endpoint }
}
