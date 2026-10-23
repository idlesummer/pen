import type { Match, Frame, Endpoint, PositionNode } from '@/pen-core'
import type { ComponentFrame, ComponentEndpoint, ComponentMatch } from '@/pen-react/renderer/types/matcher'
import type { ComponentMap } from './create-component-map'
import { traverse } from '@/lib/traverse'

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

/** Resolves one match's endpoint, with no slots attached yet. */
function resolveShell(match: Match, components: ComponentMap): ComponentMatch {
  return {
    endpoint: resolveEndpoint(match.endpoint, components),
    params: match.params,
  }
}

/** Creates a component match by resolving its endpoint and every nested slot
 *  match, walking the slot tree with `traverse` instead of recursing.
 *  slotNameOf recovers each slot's name, lost when expand flattens the
 *  slots record into the plain array traverse expects.
 *
 *  @param match - The matched endpoint and its nested slot matches.
 *  @param components - The component map used to resolve endpoints.
 *  @returns The component match with resolved components and preserved params. */
export function createComponentMatch(match: Match, components: ComponentMap): ComponentMatch {
  const resolvedOf = new Map<Match, ComponentMatch>()
  const slotNameOf = new Map<Match, string>()

  const root = resolveShell(match, components)
  resolvedOf.set(match, root)

  traverse(match, {
    expand: (node) => {
      if (!node.slots) return []
      for (const [name, slotMatch] of Object.entries(node.slots))
        slotNameOf.set(slotMatch, name)
      return Object.values(node.slots)
    },
    attach: (child, parent) => {
      const resolved = resolveShell(child, components)
      resolvedOf.set(child, resolved)

      const parentResolved = resolvedOf.get(parent)!
      parentResolved.slots ??= {}
      parentResolved.slots[slotNameOf.get(child)!] = resolved
    },
  })

  return root
}
