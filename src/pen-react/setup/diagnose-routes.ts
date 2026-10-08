import type { Diagnostic, Module } from '@/pen-core'
import type { RouteComponent } from '../renderer/types/route-component'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { ssrGlob } from '@/lib/ssr-glob'
import { createRouter, GLOBAL_DEFAULT, GLOBAL_ERROR } from '@/pen-core'
import { DefaultFallback } from '../renderer/components/DefaultBoundary'
import { ErrorFallback } from '../renderer/components/ErrorBoundary'
import { createDefaultExportMap } from './default-export-map'
import { validateAsyncPages, validateComponentExports } from './validate'

/** The shape of a route module file. */
type RouteModule = Module<RouteComponent>

/** The result of compiling and validating the app's routes. */
type RouteDiagnosis = {
  diagnostics: Diagnostic[]
  modulePaths: string[]
}

/** A formatted summary of route diagnostics. */
type DiagnosticReport = {
  warnings: string[]
  error?: string
  routes: string[]
}

/** A diagnostic's message, with its files shown relative to the project
 *  root (app dir included) instead of the app dir alone - otherwise they
 *  look route-shaped but aren't actually openable from where the build runs. */
function formatDiagnostic({ severity, rule, description, files }: Diagnostic, routesDir: string): string {
  return [`[${severity}] ${rule}: ${description}`, ...files.map(file => `  at ${routesDir}/${file}`)].join('\n')
}

/**
 * Scans the app directory for route modules and collects diagnostics from
 * route compilation and validation. Shared by `pen build` (once per build)
 * and `pen dev` (once per file add/delete).
 *
 * @param projectDir - Project directory containing the app directory.
 * @param routesDir - App route directory relative to the project directory.
 * @returns Diagnostics produced while compiling and validating the routes.
 */
async function diagnoseRoutes(projectDir: string, routesDir: string): Promise<RouteDiagnosis> {
  // Load modules and create component map
  const moduleEntries = await ssrGlob<Partial<RouteModule>>(projectDir, routesDir)
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
  return { diagnostics, modulePaths }
}

/** Reports route compilation and validation diagnostics for the app directory.
 *
 *  @param projectDir - Project directory containing the app directory.
 *  @param routesDir - App route directory relative to the project directory.
 *  @returns A formatted summary of route diagnostics. */
export async function reportRouteDiagnostics(projectDir: string, routesDir: string): Promise<DiagnosticReport> {
  if (!existsSync(join(projectDir, routesDir)))
    return { warnings: [], error: `No such directory: '${routesDir}'`, routes: [] }

  const { diagnostics, modulePaths } = await diagnoseRoutes(projectDir, routesDir)
  const warnings = diagnostics
    .filter(d => d.severity === 'warn')
    .map(d => formatDiagnostic(d, routesDir))

  const error = diagnostics
    .filter(d => d.severity === 'error')
    .map(d => formatDiagnostic(d, routesDir))
    .join('\n\n') || undefined  // Works since empty strings are falsy

  // The two sentinel keys aren't real files - nothing to list
  const routes = modulePaths.filter(path => path !== GLOBAL_DEFAULT && path !== GLOBAL_ERROR)

  return { warnings, error, routes }
}
