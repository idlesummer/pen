import type { Endpoint, PositionNode } from '../compiler'
import { traverse } from '@/lib/traverse'

/** Maps route param names to their captured values. */
export type Params = Record<string, string | string[]>

/** A matched endpoint, its params, and any matched slots. */
export type Match = {
  name: string                     // this match's slot name, or '' for the root match
  endpoint: Endpoint<PositionNode> // the winning endpoint - page or fallback, same type either way
  params: Params                  // every param bound reaching this position, in bind order
  slots?: Record<string, Match>   // one recursive match per slot this endpoint's frames declare
}

/** What findMatch actually computes - name and slots are the caller's to attach. */
type MatchResult = Pick<Match, 'endpoint' | 'params'>

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
  if (segment === undefined)
    return []

  const candidates: MatchCandidate[] = []
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
  return candidates
}

/** Finds the best endpoint or fallback using static-preferring DFS. */
function findMatch(position: PositionNode, url: string[], seedParams: Params): MatchResult {
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
  return { endpoint, params }
}

/** Splits a pathname into non-empty segments. */
function normalizeUrl(pathname: string): string[] {
  return pathname.split('/').filter(Boolean)
}

/** Matches a pathname and its declared slots against the position tree. */
export function match(positionTree: PositionNode, pathname: string): Match {
  const url = normalizeUrl(pathname)
  const mainMatch: Match = { ...findMatch(positionTree, url, {}), name: '' }

  for (const frame of mainMatch.endpoint.frames) {
    if (!frame.slots) continue
    mainMatch.slots ??= {}

    for (const [slotName, slotPosition] of Object.entries(frame.slots)) {
      const slotMatch: Match = { ...findMatch(slotPosition, url, mainMatch.params), name: slotName }
      mainMatch.slots[slotName] = slotMatch
    }
  }
  return mainMatch
}
