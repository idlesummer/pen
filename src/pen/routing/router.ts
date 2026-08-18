import type { RouteNode } from './compiling/route-tree'
import type { SearchNode } from './compiling/search-tree'
import type { RouteIssue } from './compiling/validate'
import type { Matcher } from './matcher'
import { createCompiledRoutes } from './compiler'
import { createMatcher } from './matcher'

export type Router = [
  match: Matcher,
  routeTree: RouteNode,
  searchTree: SearchNode,
  routeIssues: RouteIssue[],
]

export function createRouter(filePaths: string[]): Router {
  const [routeTree, searchTree, routeIssues] = createCompiledRoutes(filePaths)
  const matcher = createMatcher(searchTree)
  return [matcher, routeTree, searchTree, routeIssues]
}
