import type { RouteNode } from './compiling/route-tree'
import type { TrieNode } from './compiling/route-trie'
import type { CompileDiagnostic } from './compiling/compile-diagnostic'
import type { Matcher } from './matcher'
import { compile } from './compiler'
import { createMatcher } from './matcher'

export type Router = [
  matcher: Matcher,
  diagnostic: CompileDiagnostic[],
  routeTree: RouteNode,
  routeTrie: TrieNode,
]

/** Creates a router from route file paths, returning a matcher, diagnostics,
 *  and the compiled route tree and URL trie. */
export function createRouter(filePaths: string[]): Router {
  const [diagnostics, routeTree, routeTrie] = compile(filePaths)
  const matcher = createMatcher(routeTrie)
  return [matcher, diagnostics, routeTree, routeTrie]
}
