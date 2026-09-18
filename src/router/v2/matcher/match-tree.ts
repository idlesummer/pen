import type { Endpoint, PositionNode } from '../compiler/position-node'
import { traverse } from '@/lib/traverse'

export type ParamTable = Readonly<Record<string, string | string[]>>

export type MatchNode = {
  endpoint: Endpoint                 // the winning endpoint - page or fallback, same type either way
  params: ParamTable                 // every param bound reaching this position, in bind order
  slots?: Record<string, MatchNode>  // one recursive match per slot this endpoint's frames declare
}

/** Search-only bookkeeping: one competing attempt in the backtracking search,
 *  not a committed step - most of these lose to another candidate and get
 *  discarded. Doesn't need a parent pointer the way a live ancestor walk
 *  would - by the time a position has an endpoint/fallback, compile time
 *  already flattened its whole wrapper chain into `frames`, slots included,
 *  so nothing here ever needs to walk back up. */
type MatchCandidate = {
  position: PositionNode
  params: ParamTable
  isCatchall?: true // catchall always accepts, regardless of urlDepth-based exhaustion - see leave() below
  isTerminal?: true
}

/** Which children to try next, in preference order: exact literal match,
 *  then a bound param, then everything remaining. None are offered once the
 *  URL runs out - a position with no segment left to try has no children. */
function expandChildren(candidate: MatchCandidate, url: string[]): MatchCandidate[] {
  const { position, params } = candidate
  const segment = url[position.urlDepth]
  if (segment === undefined)
    return []

  const { statics, dynamic, catchall } = position
  const candidates: MatchCandidate[] = []

  if (statics?.[segment])
    candidates.push({ position: statics[segment], params })

  if (dynamic) {
    const paramName = dynamic.param!
    const newParams = { ...params, [paramName]: segment }
    candidates.push({ position: dynamic, params: newParams })
  }
  if (catchall) {
    const paramName = catchall.param!
    const segments = url.slice(position.urlDepth)
    const newParams = { ...params, [paramName]: segments }
    candidates.push({ position: catchall, params: newParams, isCatchall: true })
  }
  return candidates
}

/** Depth-first, static-preferring search over one position tree for one URL -
 *  no slots, just the winning endpoint and params at `root` itself. Accepts
 *  the first position reached with nothing left to consume (or a catchall,
 *  which always accepts) that also owns a page - stopping there, since
 *  nothing deeper down a different branch could be more specific. If nothing
 *  ever accepts, falls back to the most static-preferring dead end instead -
 *  the same guarantee `PositionNode.fallback` exists to make. */
function createMatch(root: PositionNode, url: string[], seedParams: ParamTable): MatchNode {
  const rootCandidate: MatchCandidate = { position: root, params: seedParams }
  let winner: MatchCandidate | undefined
  let bestStatic: MatchCandidate | undefined

  traverse(rootCandidate, {
    expand: (candidate) => {
      const children = expandChildren(candidate, url)
      if (!children.length)
        candidate.isTerminal = true
      return children
    },
    leave: (candidate) => {
      const position = candidate.position
      const isExhausted = !url[position.urlDepth]
      const isAccepting = isExhausted || candidate.isCatchall // url is exhausted or position is catchall

      if (isAccepting && position.endpoint)
        return (winner = candidate, true)

      const isBetterStatic = !bestStatic || position.staticness > bestStatic.position.staticness
      if (candidate.isTerminal && isBetterStatic)
        bestStatic = candidate
    },
  })
  const endpoint = winner ? winner.position.endpoint! : bestStatic!.position.fallback
  const params = (winner ?? bestStatic!).params // guaranteed: the url or the tree always exhausts eventually
  return { endpoint, params }
}

/** Resolves the match tree for one URL, then matches each declared slot
 *  independently against the same full URL with the inherited params. */
export function matchPosition(positionTree: PositionNode, url: string[]): MatchNode {
  const matchTree = createMatch(positionTree, url, {})

  for (const frame of matchTree.endpoint.frames) {
    if (!frame.slots) continue
    matchTree.slots ??= {}
    for (const [name, position] of Object.entries(frame.slots))
      matchTree.slots[name] = createMatch(position, url, matchTree.params)
  }
  return matchTree
}
