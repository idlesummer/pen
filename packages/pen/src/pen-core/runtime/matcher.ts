import { omitRecord } from '@/lib/record'
import type { Endpoint, Frame, PositionNode } from '../compiler'
import { traverse } from '@/lib/traverse'

/** Maps route param names to their captured values. */
export type Params = Record<string, string | string[]>

/** A frame as exposed through Match - Frame is already generic over what
 *  a slot holds, so this just parameterizes it with resolved matches
 *  instead of positions to search from. */
export type MatchFrame = Frame<Match>

/** An endpoint as exposed through Match, with its frames narrowed the same way. */
export type MatchEndpoint = Endpoint<Match>

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
function findMatch(position: PositionNode, url: string[]) {
  const rootCandidate: MatchCandidate = { position, params: {} }
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

/** Converts a slot's own endpoint into its Match-facing shape. */
function toLeafEndpoint(endpoint: Endpoint<PositionNode>): MatchEndpoint {
  return { ...endpoint, frames: endpoint.frames.map(frame => omitRecord(frame, 'slots')) }
}

/** Splits a pathname into non-empty segments. */
function normalizeUrl(pathname: string): string[] {
  return pathname.split('/').filter(Boolean)
}

/** Matches a pathname and its declared slots against the position tree. */
export function match(positionTree: PositionNode, pathname: string): Match {
  const url = normalizeUrl(pathname)
  const [endpoint, params] = findMatch(positionTree, url)

  const frames: MatchFrame[] = endpoint.frames.map(frame => {
    const slots: Record<string, Match> = {}

    for (const [slotName, slotPosition] of Object.entries(frame.slots ?? {})) {
      const [slotEndpoint, slotParams] = findMatch(slotPosition, url)
      slots[slotName] = {
        name: slotName,
        endpoint: toLeafEndpoint(slotEndpoint),
        params: { ...params, ...slotParams },
      }
    }
    return { ...frame, slots }
  })
  return { name: '', endpoint: { ...endpoint, frames }, params }
}
