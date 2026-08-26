import type { RouteNode } from './compiling/route-tree'
import type { SearchNode } from './compiling/search-tree'
import type { CompileDiagnostic } from './compiling/diagnostic'
import { createRouteTree } from './compiling/route-tree'
import { sanitizeRouteTree, validateRouteTree } from './compiling/route-tree-validator'
import { createSearchTree } from './compiling/search-tree'
import { sanitizeSearchTree, validateSearchTree } from './compiling/search-tree-validator'

/** Compiles file paths into route and search trees, validating and sanitizing
 *  both trees along the way. Returns the compiled trees and any route issues
 *  found during validation. */
export function createCompiledRoutes(filePaths: string[]): [RouteNode, SearchNode, CompileDiagnostic[]] {
  const routeTree = createRouteTree(filePaths)
  const diagnostics = validateRouteTree(routeTree) // intrinsic issues
  sanitizeRouteTree(routeTree)

  const searchTree = createSearchTree(routeTree)
  diagnostics.push(...validateSearchTree(searchTree)) // relational issues
  sanitizeSearchTree(searchTree)

  return [routeTree, searchTree, diagnostics]
}
