// Wires createRouteTree, validate, sanitize, createSearchTree, and
// buildRenderTree into one function.

import type { RouteNode } from './route-tree.js'
import type { SearchNode } from './search-tree.js'
import type { RouteIssue } from './validate.js'
import type { RenderNode } from './render-tree.js'
import { createRouteTree } from './route-tree.js'
import { createSearchTree } from './search-tree.js'
import { validateRouteTree, validateSearchTree } from './validate.js'
import { sanitizeRouteTree, sanitizeSearchTree } from './sanitize.js'
import { createRenderTree } from './render-tree.js'

export type Router = [
  routeTree: RouteNode,
  searchTree: SearchNode,
  routeIssues: RouteIssue[],
  match: (url: string) => [hasPage: boolean, tree?: RenderNode],
]

export function createRouter(filePaths: string[]): Router {
  const routeTree = createRouteTree(filePaths)
  const routeIssues = validateRouteTree(routeTree) // intrinsic issues
  sanitizeRouteTree(routeTree)

  const searchTree = createSearchTree(routeTree)
  routeIssues.push(...validateSearchTree(searchTree)) // relational issues
  sanitizeSearchTree(searchTree)

  return [
    routeTree,
    searchTree,
    routeIssues,
    (url) => createRenderTree(url, searchTree),
  ]
}
