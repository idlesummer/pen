import type { RouteNode } from './compiler/route-tree'
import type { SearchNode } from './compiler/search-tree'
import type { RouteIssue } from './compiler/validate'
import type { RenderNode } from './matcher/render-tree'
import { compileRoutes } from './compiler/compile'
import { createMatcher } from './matcher/match'

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
