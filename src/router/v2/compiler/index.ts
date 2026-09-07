import type { CompileDiagnostic } from '@/router/compiling/compile-diagnostic'
import type { SearchNode } from './search-tree'
import { createRouteTree } from './route-tree'
import { createSearchTree, getModulePaths } from './search-tree'
import { validateConflicts, validateRouteTree } from './validate'

export type { RouteNode } from './route-tree'
export type { Endpoint, Frame, PositionConflicts, SearchNode } from './search-tree'

export type Compiled = {
  /** The compiled artifact - the only thing that outlives this call. */
  searchTree: SearchNode
  /** Every module the tree can render, for the generated component map. */
  modulePaths: string[]
  /** Problems, each pointing at a file the user can open. */
  diagnostics: CompileDiagnostic[]
}

/** Compiles a route file list into the search tree.
 *
 *  Three steps, no mutation, no sanitize passes. The route tree is the parse
 *  and never leaves this function; the search tree is the compilation and is
 *  all anything downstream needs. `RouteNode` is reachable from neither the
 *  search tree nor this return type, so nothing can consult the parse later
 *  even by accident. */
export function compile(filePaths: string[]): Compiled {
  const routeTree = createRouteTree(filePaths)
  const { root, conflicts } = createSearchTree(routeTree)

  return {
    searchTree: root,
    modulePaths: getModulePaths(root),
    diagnostics: [...validateRouteTree(routeTree), ...validateConflicts(conflicts)],
  }
}
