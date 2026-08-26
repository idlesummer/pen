import type { RouteNode } from './compiling/route-tree'
import type { SearchNode } from './compiling/search-tree'
import type { CompileDiagnostic } from './compiling/validate'
import type { Matcher } from './matcher'
import { createCompiledRoutes } from './compiler'
import { createMatcher } from './matcher'

export type Router = [
  match: Matcher,
  diagnostic: CompileDiagnostic[],
  routeTree: RouteNode,
  searchTree: SearchNode,
]

export function createRouter(filePaths: string[]): Router {
  const [routeTree, searchTree, diagnostics] = createCompiledRoutes(filePaths)
  const matcher = createMatcher(searchTree)
  return [matcher, diagnostics, routeTree, searchTree]
}
