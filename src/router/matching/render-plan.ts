import type { Frame, SearchNode } from '../compiling/search-tree'
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

function createLayer(frame: Frame, steps: Step[], url: string[]): Layer {
  const { layout, loading, error, default: def } = frame
  const params = steps[frame.paramDepth]!.params
  const layer: Layer = { layout, loading, error, default: def }
  if (layout) layer.params = params // only a layout is handed params

  if (frame.slots && layout) { // without a layout there is nothing to receive them
    const slots = dict<RenderPlan>()
    for (const [slotName, slotSearchTree] of Object.entries(frame.slots))
      slots[slotName] = createPlan(slotSearchTree, url, params) // a slot sees its declaring position's params
    layer.slots = slots
  }
  return layer
}

/** Matches a URL and flattens the result into its wrapper chain. The endpoint
 *  already knows every frame that wraps it; the match only supplies the params
 *  each frame sees and resolves the slots along the way. Nothing walks upward,
 *  and nothing reads the route tree. */
function createPlan(searchTree: SearchNode, url: string[], base?: Params): RenderPlan {
  const { steps, endpoint } = matchUrl(searchTree, url, base)
  const layers = endpoint.frames.map(frame => createLayer(frame, steps, url))
  return { layers, content: endpoint.content, params: steps[endpoint.contentDepth]!.params }
}

/** Creates the render plan for a URL. */
export function createRenderPlan(url: string[], searchTree: SearchNode): RenderPlan {
  return createPlan(searchTree, url)
}
