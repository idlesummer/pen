import type { Match, RouteMatcher, Frame, Endpoint, PositionNode } from '@/pen-core'
import type { ComponentFrame, ComponentEndpoint, ComponentMatch, ComponentMatcher } from '@/pen-react/renderer/types/matcher'
import type { ComponentMap } from './create-component-map'

// Turns a Match's path strings into the actual components the renderer
// needs, so the renderer itself never has to know a component map exists.

/** Resolves one frame's path references into real components. Assertions are
 *  safe because frames and components come from the same createRouter() call -
 *  a missing component indicates a compiler bug. */
function resolveFrame(frame: Frame<PositionNode>, components: ComponentMap): ComponentFrame {
  return {
    layout: frame.layout ? components.layout[frame.layout] : undefined,
    loading: frame.loading ? components.loading[frame.loading] : undefined,
    error: frame.error ? components.error[frame.error] : undefined,
    default: frame.default ? components.default[frame.default] : undefined,
    slots: frame.slots ? Object.keys(frame.slots) : undefined,
    paramCount: frame.paramCount,
  }
}

/** Resolves an endpoint's content and frame chain into real components. */
function resolveEndpoint(endpoint: Endpoint<PositionNode>, components: ComponentMap): ComponentEndpoint {
  return {
    frames: endpoint.frames.map(frame => resolveFrame(frame, components)),
    content: (components.page[endpoint.contentPath] ?? components.default[endpoint.contentPath])!,
    paramCount: endpoint.paramCount,
  }
}

/** Resolves a match's endpoint and every slot's match, recursively. */
function resolveMatch(match: Match, components: ComponentMap): ComponentMatch {
  const resolved: ComponentMatch = {
    endpoint: resolveEndpoint(match.endpoint, components),
    params: match.params,
  }
  if (match.slots) {
    resolved.slots = {}
    for (const [name, slotMatch] of Object.entries(match.slots))
      resolved.slots[name] = resolveMatch(slotMatch, components)
  }
  return resolved
}

/** Wraps a matcher so it resolves straight to a renderable match - the
 *  renderer never needs to know a component map exists.
 *
 *  @param matcher - A compiled route matcher, from createRouter.
 *  @param components - The component map to resolve path references against.
 *  @returns A function from pathname straight to a resolved, renderable match. */
export function createComponentMatcher(routeMatcher: RouteMatcher, components: ComponentMap): ComponentMatcher {
  return pathname => resolveMatch(routeMatcher(pathname), components)
}
