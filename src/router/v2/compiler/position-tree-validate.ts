import type { PositionConflicts } from './position-node'
import type { CompileDiagnostic } from '@/router/compiling/compile-diagnostic'
import { getRouteSource } from './route-tree'

/** Two folders whose real default both reach the same position - which one
 *  wins is just traversal order, so keeping one silently is a real ambiguity,
 *  not a resolved case, the same way two folders claiming the same page is. */
export function validateDefaultConflicts(conflicts: PositionConflicts[]): CompileDiagnostic[] {
  const diagnostics: CompileDiagnostic[] = []

  for (const { defaults } of conflicts) {
    if (defaults.size > 1) {
      diagnostics.push({
        rule: 'duplicate-default-route',
        severity: 'error',
        message: 'multiple defaults resolve to the same URL pattern',
        files: [...defaults].map(getRouteSource),
      })
    }
  }
  return diagnostics
}
