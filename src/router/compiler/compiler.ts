import type { CompileDiagnostic } from './compile-diagnostic'
import type { PositionNode } from './position-node'
import { createRouteTree } from './route-tree'
import { createPositionTree } from './position-tree'
import { validateConflicts, validateRouteTree } from './validate'

export type CompiledRoutes = {
  /** The compiled artifact - the only thing that outlives this call. */
  positionTree: PositionNode
  /** Every module the tree can render, for the generated component map. */
  modulePaths: string[]
  /** Problems, each pointing at a file the user can open. */
  diagnostics: CompileDiagnostic[]
}

/**
 * Compiles route file paths into the representation consumed downstream.
 *
 * @param filePaths Route file paths to compile.
 */
export function compile(filePaths: string[]): CompiledRoutes {
  const routeTree = createRouteTree(filePaths)
  const [positionTree, conflicts, modulePaths] = createPositionTree(routeTree)
  const diagnostics = validateRouteTree(routeTree)
  diagnostics.push(...validateConflicts(conflicts))

  return { positionTree, modulePaths, diagnostics }
}
