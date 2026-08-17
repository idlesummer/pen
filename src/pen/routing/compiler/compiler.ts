// Public surface - re-exports, plus compileRoutes wiring the pipeline
// together. Only what router/ and the top-level index.ts actually need.

import type { RouteNode } from './route-tree'
import type { SearchNode } from './search-tree'
import type { RouteIssue } from './validate'
import { createRouteTree } from './route-tree'
import { createSearchTree } from './search-tree'
import { validateRouteTree, validateSearchTree } from './validate'
import { sanitizeRouteTree, sanitizeSearchTree } from './sanitize'

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
