import type { RouteNode } from './compiling/route-tree'
import type { TrieNode } from './compiling/route-trie'
import type { CompileDiagnostic } from './compiling/compile-diagnostic'
import { createRouteTree } from './compiling/route-tree'
import { sanitizeRouteTree, validateRouteTree } from './compiling/route-validator'
import { createRouteTrie } from './compiling/route-trie'
import { sanitizeRouteTrie, validateRouteTrie } from './compiling/trie-validator'

/** Compiles file paths into the route tree and the URL trie, validating and
 *  sanitizing both along the way. Returns any route issues found during
 *  validation and the compiled trees.
 *
 *  The route tree is returned for inspection and diagnostics only - the trie
 *  holds no reference back into it, so a caller that drops it lets the whole
 *  route tree be collected. */
export function compile(filePaths: string[]): [CompileDiagnostic[], RouteNode, TrieNode] {
  const routeTree = createRouteTree(filePaths)
  const diagnostics = validateRouteTree(routeTree) // intrinsic issues
  sanitizeRouteTree(routeTree)

  const [routeTrie, positions] = createRouteTrie(routeTree)
  diagnostics.push(...validateRouteTrie(positions)) // relational issues
  sanitizeRouteTrie(positions)

  return [diagnostics, routeTree, routeTrie]
}
