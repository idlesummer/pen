import type { SearchNode } from './search-tree.js'
import { traverse } from '@/lib/traverse.js'
import { getDynamicParam } from './search-tree.js'

export type MatchPathParams = Record<string, string | string[]>  // dynamic route parameters or catchall parameters as string arrays
export type MatchPath = {
  searchNode: SearchNode
  param?: string      // the dynamic param value this step itself captured, if any - the name is searchNode's own, via getDynamicParam
  parent?: MatchPath  // the step before this one; undefined at the root
}

function createChildMatchPaths(matchPath: MatchPath, url: string[]): MatchPath[] {
  const searchNode = matchPath.searchNode
  const urlPart = url[searchNode.index]
  if (urlPart === undefined)  // check if URL is exhausted by checking whether the next segment exists
    return []

  const childMatchPaths: MatchPath[] = []
  const staticChild = searchNode.statics?.get(urlPart)
  const dynamicChild = searchNode.dynamic

  if (staticChild)  childMatchPaths.push({ searchNode: staticChild, parent: matchPath })
  if (dynamicChild) childMatchPaths.push({ searchNode: dynamicChild, parent: matchPath, param: urlPart })
  return childMatchPaths
}

/* Returns a 'winner' or 'candidate' if url or tree exhausts. */
function classifyMatchPath(matchPath: MatchPath, url: string[]): 'winner' | 'candidate' | undefined {
  const searchNode = matchPath.searchNode
  const urlPart = url[searchNode.index]

  if (urlPart === undefined)  // means url is exhausted
    return searchNode.page ? 'winner' : 'candidate'
  if (searchNode.catchall)
    return 'winner'

  const staticSearchNode = searchNode.statics?.get(urlPart!)
  const dynamicSearchNode = searchNode.dynamic
  if (!staticSearchNode && !dynamicSearchNode)  // no static/dynamic nodes means tree is exhausted
    return 'candidate'
}

function isBetterCatchPath(candidate: MatchPath, bestCatchPath?: MatchPath): boolean {
  return !bestCatchPath || candidate.searchNode.specificity > bestCatchPath.searchNode.specificity
}

/** Finds the winning MatchPath for one tree: a real match if traversal
 *  found one, or - failing that - whichever failed branch was most
 *  static-preferring. Callers interpret what it resolved to themselves. */
export function createMatchPath(searchTree: SearchNode, url: string[]): MatchPath {
  const rootMatchPath: MatchPath = { searchNode: searchTree }
  let bestMatchPath: MatchPath | undefined
  let bestCatchPath: MatchPath | undefined  // most static-preferring failed branch seen so far

  traverse(rootMatchPath, {   // Performs a regular MatchPath traversal restricted to static and dynamic
    expand: (matchPath) =>
      createChildMatchPaths(matchPath, url),

    leave: (matchPath) => { // Once subtrees are visited,
      const classification = classifyMatchPath(matchPath, url)
      if (classification === 'winner')
        return (bestMatchPath = matchPath, true)
      if (classification === 'candidate' && isBetterCatchPath(matchPath, bestCatchPath))
        bestCatchPath = matchPath
    },
  })
  return bestMatchPath ?? bestCatchPath!  // guaranteed since url or tree eventually exhausts (safe to assert)
}

/** Assembles the full params accumulated along a walked path, seeded with
 *  whatever the search itself started with (non-empty for a slot's own
 *  search, seeded from its owner's position in the main search). */
export function getMatchPathParams(matchPathStep: MatchPath, inheritedParams: MatchPathParams): MatchPathParams {
  const params: MatchPathParams = { ...inheritedParams }
  for (let step: MatchPath | undefined = matchPathStep; step; step = step.parent) {
    if (step.param !== undefined)
      params[getDynamicParam(step.searchNode)] = step.param
  }
  return params
}
