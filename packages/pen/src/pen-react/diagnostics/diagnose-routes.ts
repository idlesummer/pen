import type { Diagnostic } from '@/pen-core'
import type { ModuleRegistry } from '@/pen-react/modules'
import { createDiagnostic, createRouter } from '@/pen-core'
import { createComponentMap } from '@/pen-react/modules'
import { validateAsyncPages, validateComponentExports } from './validate'

export type DiagnosticReport = [
  warnings: string[],
  error?: string
]

/** Re-derives a diagnostic's message with its files shown relative to the
 *  project root (app dir included) instead of the app dir alone - otherwise
 *  they look route-shaped but aren't actually openable from where the build runs. */
function formatDiagnostic(diagnostic: Diagnostic, routesDir: string): string {
  const files = diagnostic.files.map(file => `${routesDir}/${file}`)
  return createDiagnostic({ ...diagnostic, files }).message
}

/** Reports route compilation and validation diagnostics for an already-loaded
 *  module registry. Shared by `pen build` (once per build) and `pen dev`
 *  (once per file add/delete) - whatever loaded the registry decides how.
*
*  @param moduleRegistry - Each role's already-loaded route modules, keyed by role.
*  @param routesDir - App route directory, used only to format file paths in messages.
*  @returns A formatted summary of route diagnostics. */
export function createDiagnosticReport(moduleRegistry: ModuleRegistry, routesDir: string): DiagnosticReport {
  const [componentMap, componentPaths] = createComponentMap(moduleRegistry)
  const { pageEndpoints, diagnostics } = createRouter(componentPaths)

  diagnostics.push(...validateComponentExports(componentMap))
  diagnostics.push(...validateAsyncPages(pageEndpoints, componentMap))

  const warnings = diagnostics
    .filter(d => d.severity === 'warn')
    .map(d => formatDiagnostic(d, routesDir))

  const error = diagnostics
    .filter(d => d.severity === 'error')
    .map(d => formatDiagnostic(d, routesDir))
    .join('\n\n') || undefined  // Works since empty strings are falsy

  return [warnings, error]
}
