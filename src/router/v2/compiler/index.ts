import type { CompileDiagnostic } from '@/router/compiling/compile-diagnostic'
import type { PositionNode } from './position-node'
import { createRouteTree } from './route-tree'
import { createPositionTree, getModulePaths } from './position-tree'
import { validateConflicts, validateRouteTree } from './validate'

export type { RouteNode } from './route-tree'
export type { Endpoint, Frame, PositionConflicts, PositionNode } from './position-node'

export type Compiled = {
  /** The compiled artifact - the only thing that outlives this call. */
  positionTree: PositionNode
  /** Every module the tree can render, for the generated component map. */
  modulePaths: string[]
  /** Problems, each pointing at a file the user can open. */
  diagnostics: CompileDiagnostic[]
}

/** Compiles a route file list into the position tree.
 *
 *  Three steps, no mutation, no sanitize passes. The route tree is the parse
 *  and never leaves this function; the position tree is the compilation and
 *  is all anything downstream needs. `RouteNode` is reachable from neither
 *  the position tree nor this return type, so nothing can consult the parse
 *  later even by accident. */
export function compile(filePaths: string[]): Compiled {
  const routeTree = createRouteTree(filePaths)
  const [positionTree, conflicts, positions] = createPositionTree(routeTree)

  return {
    positionTree,
    modulePaths: getModulePaths(positions),
    diagnostics: [...validateRouteTree(routeTree), ...validateConflicts(conflicts)],
  }
}
