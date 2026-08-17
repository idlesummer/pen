import type { RouteNode } from './compiling/route-tree'
import type { SearchNode } from './compiling/search-tree'
import type { RouteIssue } from './compiling/validate'
import type { RenderNode } from './matching/render-tree'
import { compileRoutes } from './compiler'
import { createMatcher } from './matcher'

export type Router = [
  match: (url: string) => [hasPage: boolean, tree?: RenderNode],
  routeTree: RouteNode,
  searchTree: SearchNode,
  routeIssues: RouteIssue[],
]

export function createRouter(filePaths: string[]): Router {
  const [routeTree, searchTree, routeIssues] = compileRoutes(filePaths)
  const matcher = createMatcher(searchTree)
  return [matcher, routeTree, searchTree, routeIssues]
}
