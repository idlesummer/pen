import type { LeafPositionNode, PositionNode } from '../../compiler'
import { traverse } from '@/lib/traverse'

/** Maps route param names to their captured values. */
export type Params = Record<string, string | string[]>

/** Either a main tree position or a slot's own (never-nested) position -
 *  searched the same way either way. */
type AnyPositionNode = PositionNode | LeafPositionNode

/** A candidate explored during route matching. */
type MatchCandidate = {
  position: AnyPositionNode
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
export function findPositionEndpoint(position: AnyPositionNode, url: string[]) {
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
