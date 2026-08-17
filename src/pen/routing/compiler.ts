import type { RouteNode } from './compiling/route-tree'
import type { SearchNode } from './compiling/search-tree'
import type { RouteIssue } from './compiling/validate'
import { createRouteTree } from './compiling/route-tree'
import { createSearchTree } from './compiling/search-tree'
import { validateRouteTree, validateSearchTree } from './compiling/validate'
import { sanitizeRouteTree, sanitizeSearchTree } from './compiling/sanitize'

/** Compiles file paths into a validated, sanitized SearchNode tree - the
 *  artifact matcher/ matches against. Build-time only. */
export function compileRoutes(filePaths: string[]): [RouteNode, SearchNode, RouteIssue[]] {
  const routeTree = createRouteTree(filePaths)
  const routeIssues = validateRouteTree(routeTree) // intrinsic issues
  sanitizeRouteTree(routeTree)

  const searchTree = createSearchTree(routeTree)
  routeIssues.push(...validateSearchTree(searchTree)) // relational issues
  sanitizeSearchTree(searchTree)

  return [routeTree, searchTree, routeIssues]
}
