import type { Diagnostic, Module } from '@/pen-core'
import type { RouteComponent } from '../renderer/types/route-component'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createRouter, GLOBAL_DEFAULT, GLOBAL_ERROR } from '@/pen-core'
import { ssrGlob } from '@/lib/ssr-glob'
import { DefaultFallback } from '../renderer/components/DefaultBoundary'
import { ErrorFallback } from '../renderer/components/ErrorBoundary'
import { createDefaultExportMap } from './default-export-map'
import { validateAsyncPages, validateComponentExports } from './validate'

/** The shape of a route module file. */
type RouteModule = Module<RouteComponent>

/** A formatted summary of route diagnostics. */
type DiagnosticReport = {
  warnings: string[]
  error?: string
}

/**
 * Scans the app directory for route modules and collects diagnostics from
 * route compilation and validation. Shared by `pen build` (once per build)
 * and `pen dev` (once per file add/delete).
 *
 * @param projectDir - Project directory containing the app directory.
 * @param appDir - App route directory relative to the project directory.
 * @returns Diagnostics produced while compiling and validating the routes.
 */
async function diagnoseRoutes(projectDir: string, appDir: string): Promise<Diagnostic[]> {
  // Load modules and create component map
  const moduleEntries = await ssrGlob<Partial<RouteModule>>(projectDir, appDir)
  const routeComponents = createDefaultExportMap<RouteComponent>(moduleEntries, {
    [GLOBAL_DEFAULT]: DefaultFallback,
    [GLOBAL_ERROR]: ErrorFallback,
  })

  // Create router and collect diagnostics
  const filePaths = moduleEntries.map(entry => entry[0])
  const { modulePaths, pageEndpoints, diagnostics } = createRouter(filePaths)

  // Collect additional runtime diagnostics
  diagnostics.push(...validateComponentExports(modulePaths, routeComponents))
  diagnostics.push(...validateAsyncPages(pageEndpoints, routeComponents))
  return diagnostics
}

/** Reports route compilation and validation diagnostics for the app directory.
 *
 *  @param projectDir - Project directory containing the app directory.
 *  @param appDir - App route directory relative to the project directory.
 *  @returns A formatted summary of route diagnostics. */
export async function reportRouteDiagnostics(projectDir: string, appDir: string): Promise<DiagnosticReport> {
  if (!existsSync(join(projectDir, appDir)))
    return { warnings: [], error: `No such directory: '${appDir}'` }

  const diagnostics = await diagnoseRoutes(projectDir, appDir)
  const warnings = diagnostics
    .filter(d => d.severity === 'warn')
    .map(d => `${d.message} (${d.files.join(', ')})`)

  const error = diagnostics
    .filter(d => d.severity === 'error')
    .map(d => d.message)
    .join('\n\n') || undefined  // Works since empty strings are falsy

  return { warnings, error }
}
