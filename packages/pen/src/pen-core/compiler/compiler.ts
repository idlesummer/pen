import type { Diagnostic } from './validate'
import type { Endpoint, PositionNode } from './position'
import { createRouteTree } from './route'
import { createPositionTree } from './position'
import { validateConflicts, validateRouteTree } from './validate'

export type CompiledRoutes = {
  /** The compiled artifact - the only thing that outlives this call. */
  positionTree: PositionNode
  /** Every module the tree can render, for the generated component map. */
  modulePaths: string[]
  /** Every page endpoint, for validation that needs each page's own frame chain. */
  pageEndpoints: Endpoint<PositionNode>[]
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
  const [positionTree, claims, modulePaths, pageEndpoints] = createPositionTree(routeTree)
  const diagnostics = validateRouteTree(routeTree)
  diagnostics.push(...validateConflicts(claims))

  return { positionTree, modulePaths, pageEndpoints, diagnostics }
}
