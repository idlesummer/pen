import type { Endpoint, PositionNode } from '../compiler/position-node'
import { traverse } from '@/lib/traverse'

export type ParamTable = Record<string, string | string[]>

export type MatchNode = {
  endpoint: Endpoint                 // the winning endpoint - page or fallback, same type either way
  params: ParamTable                 // every param bound reaching this position, in bind order
  slots?: Record<string, MatchNode>  // one recursive match per slot this endpoint's frames declare
}

/** Search-only bookkeeping. Doesn't need a parent pointer the way a live
 *  ancestor walk would - by the time a position has an endpoint/fallback,
 *  compile time already flattened its whole wrapper chain into `frames`,
 *  slots included, so nothing here ever needs to walk back up. */
type MatchStep = {
  position: PositionNode
  params: ParamTable
  viaCatchall?: true // catchall always accepts, regardless of urlDepth-based exhaustion - see leave() below
  isTerminal?: true
}

/** Which children to try next, in preference order: exact literal match,
 *  then a bound param, then everything remaining. None are offered once the
 *  URL runs out - a position with no segment left to try has no children. */
function expandMatchSteps(step: MatchStep, url: string[]): MatchStep[] {
  const { position, params } = step
  const segment = url[position.urlDepth]
  if (segment === undefined) return []

  const steps: MatchStep[] = []
  const staticChild = position.statics?.[segment]
  if (staticChild)
    steps.push({ position: staticChild, params })

  if (position.dynamic)
    steps.push({ position: position.dynamic, params: { ...params, [position.dynamic.param!]: segment } })

  if (position.catchall) {
    const rest = url.slice(position.urlDepth)
    steps.push({ position: position.catchall, params: { ...params, [position.catchall.param!]: rest }, viaCatchall: true })
  }
  return steps
}

/** Every slot a winning chain's frames declare gets matched independently
 *  against the same full URL, not a remaining suffix - parallel routes, not
 *  nested ones. Seeded with the params already bound reaching this chain,
 *  since paramDepth/contentDepth are continuous through a slot boundary. */
function matchSlots(endpoint: Endpoint, url: string[], params: ParamTable): Record<string, MatchNode> | undefined {
  let slots: Record<string, MatchNode> | undefined
  for (const frame of endpoint.frames) {
    if (!frame.slots) continue
    slots ??= {}
    for (const [name, slotRoot] of Object.entries(frame.slots))
      slots[name] = matchPosition(slotRoot, url, params)
  }
  return slots
}

/** Depth-first, static-preferring search over one position tree for one URL.
 *  Accepts the first position reached with nothing left to consume (or a
 *  catchall, which always accepts) that also owns a page - stopping there,
 *  since nothing deeper down a different branch could be more specific. If
 *  nothing ever accepts, falls back to the most static-preferring dead end
 *  instead - the same guarantee `PositionNode.fallback` exists to make. */
export function matchPosition(root: PositionNode, url: string[], seedParams: ParamTable = {}): MatchNode {
  const rootStep: MatchStep = { position: root, params: seedParams }
  let winner: MatchStep | undefined
  let bestStatic: MatchStep | undefined

  traverse(rootStep, {
    expand: (step) => {
      const children = expandMatchSteps(step, url)
      if (!children.length) step.isTerminal = true
      return children
    },
    leave: (step) => {
      const { position } = step
      const isExhausted = url[position.urlDepth] === undefined
      const isAccepting = isExhausted || step.viaCatchall

      if (isAccepting && position.endpoint) {
        winner = step
        return true
      }
      if (step.isTerminal && (!bestStatic || position.staticness > bestStatic.position.staticness))
        bestStatic = step
    },
  })

  const chosen = winner ?? bestStatic! // guaranteed: the url or the tree always exhausts eventually
  const endpoint = winner ? winner.position.endpoint! : bestStatic!.position.fallback
  return { endpoint, params: chosen.params, slots: matchSlots(endpoint, url, chosen.params) }
}
