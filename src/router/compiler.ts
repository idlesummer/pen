import type { RouteNode } from './compiling/route-tree'
import type { SearchNode } from './compiling/search-tree'
import type { CompileDiagnostic } from './compiling/compile-diagnostic'
import { createRouteTree } from './compiling/route-tree'
import { sanitizeRouteTree, validateRouteTree } from './compiling/route-validator'
import { createSearchTree } from './compiling/search-tree'
import { sanitizeSearchTree, validateSearchTree } from './compiling/search-validator'

/** Compiles file paths into the route tree and the search tree, validating and
 *  sanitizing both along the way. Returns any route issues found during
 *  validation and the compiled trees.
 *
 *  The route tree is returned for inspection and diagnostics only - the search tree
 *  holds no reference back into it, so a caller that drops it lets the whole
 *  route tree be collected. */
export function compile(filePaths: string[]): [CompileDiagnostic[], RouteNode, SearchNode] {
  const routeTree = createRouteTree(filePaths)
  const diagnostics = validateRouteTree(routeTree) // intrinsic issues
  sanitizeRouteTree(routeTree)

  const [searchTree, positions] = createSearchTree(routeTree)
  diagnostics.push(...validateSearchTree(positions)) // relational issues
  sanitizeSearchTree(positions)

  return [diagnostics, routeTree, searchTree]
}
