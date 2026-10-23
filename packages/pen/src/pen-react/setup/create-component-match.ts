import type { Match, Frame, Endpoint, PositionNode } from '@/pen-core'
import type { ComponentFrame, ComponentEndpoint, ComponentMatch } from '@/pen-react/renderer/types/matcher'
import type { ComponentMap } from './create-component-map'
import { traverse } from '@/lib/traverse'

// Turns a Match's path strings into the actual components the renderer
// needs, so the renderer itself never has to know a component map exists.

/** Resolves one frame's path references into real components. Assertions are
 *  safe because frames and components come from the same createRouter() call -
 *  a missing component indicates a compiler bug. */
function createComponentFrame(frame: Frame<PositionNode>, components: ComponentMap): ComponentFrame {
  const layout = frame.layout ? components.layout[frame.layout] : undefined
  const loading = frame.loading ? components.loading[frame.loading] : undefined
  const error = frame.error ? components.error[frame.error] : undefined
  const default_ = frame.default ? components.default[frame.default] : undefined
  const slots = frame.slots ? Object.keys(frame.slots) : undefined
  const paramCount = frame.paramCount
  return { layout, loading, error, default: default_, slots, paramCount }
}

/** Resolves an endpoint's content and frame chain into real components. */
function createComponentEndpoint(endpoint: Endpoint<PositionNode>, components: ComponentMap): ComponentEndpoint {
  const frames = endpoint.frames.map(frame => createComponentFrame(frame, components))
  const content = (components.page[endpoint.contentPath] ?? components.default[endpoint.contentPath])!
  const paramCount = endpoint.paramCount
  return { frames, content, paramCount }
}

/** Resolves one match's endpoint, with no slots attached yet. */
function createComponentMatch(match: Match, components: ComponentMap): ComponentMatch {
  const endpoint = createComponentEndpoint(match.endpoint, components)
  const params = match.params
  return { endpoint, params }
}

/** Creates a component match by resolving its endpoint and every nested slot
 *  match, walking the slot tree with `traverse` instead of recursing.
 *  slotNameOf recovers each slot's name, lost when expand flattens the
 *  slots record into the plain array traverse expects.
 *
 *  @param match - The matched endpoint and its nested slot matches.
 *  @param components - The component map used to resolve endpoints.
 *  @returns The component match with resolved components and preserved params. */
export function createComponentTree(match: Match, components: ComponentMap): ComponentMatch {
  const slotComponentMatchOf = new Map<Match, ComponentMatch>()
  const slotNameOf = new Map<Match, string>()

  const mainComponentMatch = createComponentMatch(match, components)
  slotComponentMatchOf.set(match, mainComponentMatch)

  traverse(match, {
    expand: (node) => {
      if (!node.slots) return []
      for (const [slotName, slotMatch] of Object.entries(node.slots))
        slotNameOf.set(slotMatch, slotName)
      return Object.values(node.slots)
    },
    attach: (child, parent) => {
      const resolved = createComponentMatch(child, components)
      slotComponentMatchOf.set(child, resolved)

      const parentResolved = slotComponentMatchOf.get(parent)!
      parentResolved.slots ??= {}
      parentResolved.slots[slotNameOf.get(child)!] = resolved
    },
  })
  return mainComponentMatch
}
