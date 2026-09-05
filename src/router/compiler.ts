import type { RouteNode } from './compiling/route-tree'
import type { SearchNode } from './compiling/search-tree.new'
import type { CompileDiagnostic } from './compiling/compile-diagnostic'
import { createRouteTree } from './compiling/route-tree'
import { sanitizeRouteTree, validateRouteTree } from './compiling/route-validator'
import { createSearchTree } from './compiling/search-tree.new'
import { sanitizeSearchTree, validateSearchTree } from './compiling/search-validator'

/** Compiles file paths into route and search trees, validating and sanitizing
 *  both trees along the way. Returns any route issues found during validation
 *  and the compiled trees. */
export function compile(filePaths: string[]): [CompileDiagnostic[], RouteNode, SearchNode] {
  const routeTree = createRouteTree(filePaths)
  const diagnostics = validateRouteTree(routeTree) // intrinsic issues
  sanitizeRouteTree(routeTree)

  const searchTree = createSearchTree(routeTree)
  diagnostics.push(...validateSearchTree(searchTree)) // relational issues
  sanitizeSearchTree(searchTree)

  return [diagnostics, routeTree, searchTree]
}
