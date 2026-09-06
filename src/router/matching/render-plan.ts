import type { Endpoint, Frame, SearchNode } from '../compiling/search-tree'
import type { Params, Step } from './match'
import { dict } from '@/lib/dict'
import { matchUrl } from './match'

/** One wrapper in the chain, already resolved to module paths. Rendering is
 *  a fold from the inside out - nothing left to decide. */
export type Layer = {
  layout?: string
  loading?: string
  error?: string
  default?: string
  params?: Params                    // only for a layer owning a layout, which receives them
  slots?: Record<string, RenderPlan> // named slots, each already a plan of its own
}

/** A flat, outermost-first chain of wrappers around one piece of content.
 *  This is a list because it always was one - the nesting in the old
 *  RenderNode was a linked list wearing a tree's clothes. */
export type RenderPlan = {
  layers: Layer[]
  content: string
  params: Params
}

/** Turns one frame into a layer. Slots are passed in rather than resolved
 *  here, so this never reaches back into planning. */
function createLayer(frame: Frame, steps: Step[], slots?: Record<string, RenderPlan>): Layer {
  const { layout, loading, error, default: def } = frame
  const layer: Layer = { layout, loading, error, default: def }
  if (!layout) return layer // without a layout there is nothing to hand params or slots to

  layer.params = steps[frame.paramDepth]!.params
  if (slots) layer.slots = slots
  return layer
}

function createPlan(endpoint: Endpoint, steps: Step[], layers: Layer[]): RenderPlan {
  return { layers, content: endpoint.content, params: steps[endpoint.contentDepth]!.params }
}

/** A slot's own plan. It can never declare slots of its own - nested slots are
 *  structurally disallowed - so the chain stops here rather than cycling back
 *  into createRenderPlan. */
function createSlotPlan(slotSearchNode: SearchNode, url: string[], base: Params): RenderPlan {
  const { steps, endpoint } = matchUrl(slotSearchNode, url, base)
  return createPlan(endpoint, steps, endpoint.frames.map(frame => createLayer(frame, steps)))
}

/** Matches a URL and flattens the result into its wrapper chain. The endpoint
 *  already knows every frame that wraps it; the match only supplies the params
 *  each frame sees and resolves the slots along the way. Nothing walks upward,
 *  and nothing reads the route tree. */
export function createRenderPlan(url: string[], searchTree: SearchNode): RenderPlan {
  const { steps, endpoint } = matchUrl(searchTree, url)

  const layers = endpoint.frames.map((frame) => {
    if (!frame.slots || !frame.layout) // no layout means nothing to pass a slot to
      return createLayer(frame, steps)

    const params = steps[frame.paramDepth]!.params
    const slots = dict<RenderPlan>()
    for (const [slotName, slotSearchNode] of Object.entries(frame.slots))
      slots[slotName] = createSlotPlan(slotSearchNode, url, params) // a slot sees its declaring position's params
    return createLayer(frame, steps, slots)
  })
  return createPlan(endpoint, steps, layers)
}
