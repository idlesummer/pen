import type { Diagnostic } from './diagnostic'
import type { Endpoint, PositionNode } from './position-node'
import { createRouteTree } from './route-tree'
import { createPositionTree } from './position-tree'
import { validateConflicts, validateRouteTree } from './validate'

export type CompiledRoutes = {
  /** The compiled artifact - the only thing that outlives this call. */
  positionTree: PositionNode
  /** Every module the tree can render, for the generated component map. */
  modulePaths: string[]
  /** Every real page endpoint, for validation that needs each page's own
   *  frame chain rather than just its module path. */
  pageEndpoints: Endpoint[]
  /** Problems, each pointing at a file the user can open. */
  diagnostics: Diagnostic[]
}

/**
 * Compiles route file paths into the representation consumed downstream.
 *
 * @param filePaths Route file paths to compile.
 */
export function compileApp(filePaths: string[]): CompiledRoutes {
  const routeTree = createRouteTree(filePaths)
  const [positionTree, conflicts, modulePaths, pageEndpoints] = createPositionTree(routeTree)
  const diagnostics = validateRouteTree(routeTree)
  diagnostics.push(...validateConflicts(conflicts))

  return { positionTree, modulePaths, pageEndpoints, diagnostics }
}
