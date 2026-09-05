import type { RouteNode } from './compiling/route-tree'
import type { SearchNode } from './compiling/search-tree.new'
import type { CompileDiagnostic } from './compiling/compile-diagnostic'
import type { Matcher } from './matcher'
import { compile } from './compiler'
import { createMatcher } from './matcher'

export type Router = [
  matcher: Matcher,
  diagnostic: CompileDiagnostic[],
  routeTree: RouteNode,
  searchTree: SearchNode,
]

/** Creates a router from route file paths, returning a matcher, diagnostics,
 *  and the compiled route and search trees. */
export function createRouter(filePaths: string[]): Router {
  const [diagnostics, routeTree, searchTree] = compile(filePaths)
  const matcher = createMatcher(searchTree)
  return [matcher, diagnostics, routeTree, searchTree]
}
