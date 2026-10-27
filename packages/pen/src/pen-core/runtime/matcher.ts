import type { Endpoint, Frame, PositionNode } from '../compiler'
import { traverse } from '@/lib/traverse'

/** Maps route param names to their captured values. */
export type Params = Record<string, string | string[]>

/** A frame as exposed through Match - each declared slot holds its own
 *  resolved match directly, instead of a position to search from. */
export type MatchFrame = Omit<Frame<PositionNode>, 'slots'> & {
  slots?: Record<string, Match>
}

/** An endpoint as exposed through Match, with its frames narrowed the same way. */
export type MatchEndpoint = Omit<Endpoint<PositionNode>, 'frames'> & {
  frames: MatchFrame[]
}

/** A matched endpoint and its params, with every declared slot already resolved. */
export type Match = {
  name: string            // this match's slot name, or '' for the root match
  endpoint: MatchEndpoint // the winning endpoint - page or fallback, same type either way
  params: Params          // every param bound reaching this position, in bind order
}

/** A candidate explored during route matching. */
type MatchCandidate = {
  position: PositionNode
  params: Params
  isCatchall?: true // catchall always accepts, regardless of urlDepth-based exhaustion - see leave() below
  isTerminal?: true
}

/** Expands a candidate into matching children, ordered by preference. */
function expand(candidate: MatchCandidate, url: string[]): MatchCandidate[] {
  const { position, params } = candidate
  const segment = url[position.urlDepth]
  const candidates: MatchCandidate[] = []

  if (segment !== undefined) {
    if (position.statics?.[segment])
      candidates.push({ position: position.statics[segment], params })

    if (position.dynamic) {
      const paramName = position.dynamic.param!
      const newParams: Params = { ...params, [paramName]: segment }
      candidates.push({ position: position.dynamic, params: newParams })
    }
    if (position.catchall) {
      const paramName = position.catchall.param!
      const segments = url.slice(position.urlDepth)
      const newParams: Params = { ...params, [paramName]: segments }
      candidates.push({ position: position.catchall, params: newParams, isCatchall: true })
    }
  }
  return candidates
}

/** Finds the best endpoint or fallback using static-preferring DFS. */
function findMatch(position: PositionNode, url: string[], seedParams: Params) {
  const rootCandidate: MatchCandidate = { position, params: seedParams }
  let winner: MatchCandidate | undefined
  let bestStatic: MatchCandidate | undefined

  traverse(rootCandidate, {
    expand: (candidate) => {
      const children = expand(candidate, url)
      if (!children.length) candidate.isTerminal = true
      return children
    },
    leave: (candidate) => {
      const position = candidate.position
      const isExhausted = !url[position.urlDepth]
      const isAccepting = isExhausted || candidate.isCatchall // url is exhausted or position is catchall

      if (isAccepting && position.endpoint)
        return (winner = candidate, true)

      const isBetterStatic = !bestStatic || position.dynamicCount < bestStatic.position.dynamicCount
      if (candidate.isTerminal && isBetterStatic)
        bestStatic = candidate
    },
  })
  const endpoint = winner ? winner.position.endpoint! : bestStatic!.position.fallback
  const params = (winner ?? bestStatic!).params // guaranteed: the url or the tree always exhausts eventually
  return [endpoint, params] as const
}

/** Builds a frame as exposed through Match - slot keys known upfront,
 *  values filled in by createMatch once each slot's own match is resolved. */
function toMatchFrame(frame: Frame<PositionNode>): MatchFrame {
  const slots = frame.slots && Object.fromEntries(
    Object.keys(frame.slots).map(name => [name, undefined as unknown as Match]),
  )
  return { ...frame, slots }
}

/** Splits a pathname into non-empty segments. */
function normalizeUrl(pathname: string): string[] {
  return pathname.split('/').filter(Boolean)
}

/** Builds a Match for an already-resolved endpoint, then resolves and
 *  attaches each of its frames' own declared slots, recursively - so a
 *  slot's own nested slots get resolved too, not just its first level. */
function createMatch(name: string, endpoint: Endpoint<PositionNode>, params: Params, url: string[]): Match {
  const matchFrames = endpoint.frames.map(toMatchFrame)
  const match: Match = { name, endpoint: { ...endpoint, frames: matchFrames }, params }

  endpoint.frames.forEach((frame, index) => {
    if (!frame.slots) return
    const matchFrame = matchFrames[index]!

    for (const [slotName, slotPosition] of Object.entries(frame.slots)) {
      const [slotEndpoint, slotParams] = findMatch(slotPosition, url, params)
      matchFrame.slots![slotName] = createMatch(slotName, slotEndpoint, slotParams, url)
    }
  })
  return match
}

/** Matches a pathname and its declared slots against the position tree. */
export function match(positionTree: PositionNode, pathname: string): Match {
  const url = normalizeUrl(pathname)
  const [endpoint, params] = findMatch(positionTree, url, {})
  return createMatch('', endpoint, params, url)
}
