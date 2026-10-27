import type { Endpoint, Frame, PositionNode } from '../compiler'
import { omitRecord } from '@/lib/record'
import { traverse } from '@/lib/traverse'

/** Maps route param names to their captured values. */
export type Params = Record<string, string | string[]>

/** A matched endpoint and its params, with every declared slot already resolved. */
export type Match = {
  name: string            // this match's slot name, or '' for the root match
  endpoint: Endpoint<Match> // the winning endpoint - page or fallback, same type either way
  params: Params          // every param bound reaching this position, in bind order
}

export type MatchEndpoint = Match['endpoint']
export type MatchFrame = MatchEndpoint['frames'][number]

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

/** Matches a slot without resolving its own slots. */
function createMatchFrameSlot(name: string, position: PositionNode, url: string[], mainParams: Params): Match {
  const [slotEndpoint, slotParams] = findMatch(position, url)
  const endpoint = { ...slotEndpoint, frames: slotEndpoint.frames.map(frame => omitRecord(frame, 'slots')) }
  const params = { ...mainParams, ...slotParams }
  return { name, endpoint, params }
}

function createMatchFrame(frame: Frame<PositionNode>, url: string[], mainParams: Params): MatchFrame {
  const slots: Record<string, Match> = {}

  for (const [name, position] of Object.entries(frame.slots ?? {}))
    slots[name] = createMatchFrameSlot(name, position, url, mainParams)
  return { ...frame, slots }
}

/** Matches a pathname and its declared slots against the position tree. */
export function match(positionTree: PositionNode, pathname: string): Match {
  const url = pathname.split('/').filter(Boolean)
  const [mainEndpoint, mainParams] = findMatch(positionTree, url)
  const frames = mainEndpoint.frames.map(frame => createMatchFrame(frame, url, mainParams))

  return { name: '', endpoint: { ...mainEndpoint, frames }, params: mainParams }
}
