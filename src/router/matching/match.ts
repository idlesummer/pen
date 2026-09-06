import type { SearchNode } from '../compiling/search-tree'
import type { Endpoint } from '../compiling/search-tree'
import { dict } from '@/lib/dict'

export type Params = Record<string, string | string[]>

/** One position on the winning path, with the params visible AT that position
 *  - bound on the way down, never re-derived by walking back up. */
export type Step = {
  node: SearchNode
  params: Params
}

export type MatchPath = {
  steps: Step[]      // root-ward to leaf-ward, index === SearchNode.depth
  endpoint: Endpoint // the page that accepted, or the fallback for where we stopped
}

const NO_PARAMS: Params = dict()

function bindParams(params: Params, node: SearchNode, url: string[]): Params {
  if (!node.param) return params
  const value = node.isCatchall ? url.slice(node.urlDepth) : url[node.urlDepth]!
  const bound = Object.assign(dict<string | string[]>(), params)
  bound[node.param] = value
  return bound
}

/** Matches a URL against the search tree, returning the winning path and what to
 *  render at the end of it.
 *
 *  The walk carries its own path on the call stack, so a branch that loses
 *  costs nothing on the heap. A branch that reaches a page wins outright;
 *  otherwise the most static-preferring dead end is kept, and its position's
 *  fallback renders. Either way something renders - the default guarantee is
 *  a compile-time property of every position.
 *
 *  `base` seeds the params, so a slot's own match path inherits the params of
 *  the position that declares it - a slot under `[id]` sees `id` throughout. */
export function matchUrl(root: SearchNode, url: string[], base: Params = NO_PARAMS): MatchPath {
  const steps: Step[] = []
  let best: Step[] | undefined
  let bestStaticness = 0

  function descend(node: SearchNode, params: Params): boolean {
    steps.push({ node, params })
    const segment = url[node.urlDepth + 1]
    let hasChildren = false

    if (segment) { // an exhausted url consumes nothing further
      const staticChild = node.statics?.[segment]
      const { dynamic, catchall } = node
      hasChildren = !!(staticChild || dynamic || catchall)

      // Tried in preference order: an exact segment beats a param beats a rest.
      if (staticChild && descend(staticChild, bindParams(params, staticChild, url))) return true
      if (dynamic && descend(dynamic, bindParams(params, dynamic, url))) return true
      if (catchall && descend(catchall, bindParams(params, catchall, url))) return true
    }

    // Checked after the children, so a deeper page always wins over this one.
    if ((!segment || node.isCatchall) && node.page)
      return true

    if (!hasChildren && (!best || node.staticness > bestStaticness)) {
      best = steps.slice()
      bestStaticness = node.staticness
    }
    steps.pop()
    return false
  }

  if (descend(root, base))
    return { steps, endpoint: steps[steps.length-1]!.node.page! }

  const bestSteps = best! // guaranteed: the root itself is a dead end at worst
  return { steps: bestSteps, endpoint: bestSteps[bestSteps.length-1]!.node.fallback }
}
