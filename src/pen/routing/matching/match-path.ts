import type { RouteNode } from '../compiling/route-tree'
import type { SearchNode } from '../compiling/search-tree'
import { traverse } from '@/lib/traverse'
import { getDynamicParamName } from '../compiling/search-tree'

export type ParamTable = Record<string, string | string[]> // dynamic route parameters or catchall parameters as string arrays
export type MatchPath = {
  searchNode: SearchNode
  moduleNode?: RouteNode          // the page/catchall this step resolved to, set by classifyMatchPath once it settles a winner
  dynamicParamValue?: string      // the dynamic param value this step itself captured, if any - the name is searchNode's own, via getDynamicParamName
  catchallParamValues?: string[]  // the captured tail segments, only set when moduleNode came from a catchall
  parent?: MatchPath              // the step before this one; undefined at the root
}

function createChildMatchPaths(parentMatchPath: MatchPath, url: string[]): MatchPath[] {
  const parentSearchNode = parentMatchPath.searchNode
  const urlPart = url[parentSearchNode.urlPos+1]
  if (urlPart === undefined)  // check if URL is exhausted by checking whether the next segment exists
    return []

  const childMatchPaths: MatchPath[] = []
  const staticChild = parentSearchNode.statics?.get(urlPart)
  const dynamicChild = parentSearchNode.dynamic

  if (staticChild) {
    const searchNode = staticChild
    const parent = parentMatchPath
    childMatchPaths.push({ searchNode, parent })
  }
  if (dynamicChild && urlPart) {
    const searchNode = dynamicChild
    const parent = parentMatchPath
    const dynamicParamValue = urlPart
    childMatchPaths.push({ searchNode, parent, dynamicParamValue })
  }
  return childMatchPaths
}

/** Returns a 'winner' or 'candidate' if url or tree exhausts. Settles the
 *  winning matchPath's moduleNode (and catchallParamValues, for catchalls)
 *  here, once, so callers never re-derive them from url/urlPos again. */
function classifyMatchPath(matchPath: MatchPath, url: string[]): 'winner' | 'candidate' | undefined {
  const searchNode = matchPath.searchNode
  const urlPart = url[searchNode.urlPos+1]

  if (urlPart === undefined) {  // means url is exhausted
    if (!searchNode.page) return 'candidate'
    matchPath.moduleNode = searchNode.page
    return 'winner'
  }
  if (searchNode.catchall) {
    matchPath.moduleNode = searchNode.catchall
    matchPath.catchallParamValues = url.slice(searchNode.urlPos+1)
    return 'winner'
  }
  const staticSearchNode = searchNode.statics?.get(urlPart)
  const dynamicSearchNode = urlPart.length ? searchNode.dynamic : undefined  // dynamic rejects empty-string captures
  if (!staticSearchNode && !dynamicSearchNode)  // no static/dynamic nodes means tree is exhausted
    return 'candidate'
}

function isBetterDefaultPath(candidate: MatchPath, bestDefaultPath?: MatchPath): boolean {
  return !bestDefaultPath || candidate.searchNode.staticness > bestDefaultPath.searchNode.staticness
}

/** Finds the winning MatchPath for one tree: a real match if traversal
 *  found one, or - failing that - whichever failed branch was most
 *  static-preferring. Callers interpret what it resolved to themselves. */
export function createMatchPath(searchTree: SearchNode, url: string[]): MatchPath {
  const matchPathHead: MatchPath = { searchNode: searchTree }
  let bestMatchPath: MatchPath | undefined
  let bestDefaultPath: MatchPath | undefined  // most static-preferring failed branch seen so far

  traverse(matchPathHead, {   // Performs a regular MatchPath traversal restricted to static and dynamic
    expand: (matchPath) =>
      createChildMatchPaths(matchPath, url),

    leave: (matchPath) => { // Once subtrees are visited,
      const matchClass = classifyMatchPath(matchPath, url)
      if (matchClass === 'winner')
        return (bestMatchPath = matchPath, true)
      if (matchClass === 'candidate' && isBetterDefaultPath(matchPath, bestDefaultPath))
        bestDefaultPath = matchPath
    },
  })
  return bestMatchPath ?? bestDefaultPath!  // guaranteed since url or tree eventually exhausts (safe to assert)
}

/** Assembles the params accumulated by walking matchPath's own chain -
 *  callers combine this with any inherited table themselves. */
export function getParamTable(matchPath: MatchPath): ParamTable {
  const paramTable: ParamTable = {}
  for (let path: MatchPath | undefined = matchPath; path; path = path.parent) {
    if (path.dynamicParamValue !== undefined)
      paramTable[getDynamicParamName(path.searchNode)] = path.dynamicParamValue
  }
  return paramTable
}

/** Creates a reverse look up for slot-bearing RouteNodes to its corresponding MatchPath. */
export function getSlotMatchPaths(matchPath: MatchPath): Map<RouteNode, MatchPath> {
  const slotMatchPaths = new Map<RouteNode, MatchPath>()
  for (let path: MatchPath | undefined = matchPath; path; path = path.parent) {
    if (path.searchNode.slots)
      slotMatchPaths.set(path.searchNode.anchor, path)
  }
  return slotMatchPaths
}
