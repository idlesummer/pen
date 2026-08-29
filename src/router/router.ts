import type { RouteNode } from './compiling/route-tree'
import type { SearchNode } from './compiling/search-tree'
import type { CompileDiagnostic } from './compiling/diagnostic'
import type { Matcher } from './matcher'
import { createCompiledRoutes } from './compiler'
import { createMatcher } from './matcher'

export type Router = [
  match: Matcher,
  diagnostic: CompileDiagnostic[],
  routeTree: RouteNode,
  searchTree: SearchNode,
]

/** Creates a router from route file paths, returning a matcher, diagnostics,
 *  and the compiled route and search trees. */
export function createRouter(filePaths: string[]): Router {
  const [diagnostics, routeTree, searchTree] = createCompiledRoutes(filePaths)
  const matcher = createMatcher(searchTree)
  return [matcher, diagnostics, routeTree, searchTree]
}
