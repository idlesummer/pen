import type { Diagnostic } from '@/pen-core'
import type { ViteDevServer } from 'vite'
import type { ModuleEntries } from './default-export-map'
import type { AnyComponent, RoleModuleEntries } from './build-component-map'
import { basename, join } from 'node:path'
import { existsSync } from 'node:fs'
import { ssrGlob } from '@/lib/ssr-glob'
import { createRouter, getModuleRole, GLOBAL_DEFAULT, GLOBAL_ERROR } from '@/pen-core'
import { buildComponentMap } from './build-component-map'
import { validateAsyncPages, validateComponentExports } from './validate'

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

/** Splits a flat glob scan into the same role-separated shape the production
 *  path already gets for free from Vite's per-role globs. Entries whose
 *  filename isn't a recognized module role (a stray non-route .tsx file, say)
 *  are silently dropped - modulePaths (from createRouter) stays the real
 *  source of truth for which paths are actual routes. */
function classifyByRole(entries: ModuleEntries<AnyComponent>): RoleModuleEntries {
  const byRole: RoleModuleEntries = { page: [], layout: [], loading: [], error: [], default: [] }
  for (const entry of entries) {
    const role = getModuleRole(basename(entry[0]))
    // Each push asserts what the filename check just verified - TS can't see
    // that connection on its own, since the role is only known at runtime.
    if (role === 'page') byRole.page.push(entry as RoleModuleEntries['page'][number])
    else if (role === 'layout') byRole.layout.push(entry as RoleModuleEntries['layout'][number])
    else if (role === 'loading') byRole.loading.push(entry as RoleModuleEntries['loading'][number])
    else if (role === 'error') byRole.error.push(entry as RoleModuleEntries['error'][number])
    else if (role === 'default') byRole.default.push(entry as RoleModuleEntries['default'][number])
  }
  return byRole
}

/**
 * Scans the app directory for route modules and collects diagnostics from
 * route compilation and validation. Shared by `pen build` (once per build)
 * and `pen dev` (once per file add/delete).
 *
 * @param projectDir - Project directory containing the app directory.
 * @param routesDir - App route directory relative to the project directory.
 * @param server - An existing dev server to reuse, if one is already running.
 * @returns Diagnostics produced while compiling and validating the routes.
 */
async function diagnoseRoutes(projectDir: string, routesDir: string, server?: ViteDevServer): Promise<RouteDiagnosis> {
  // Load modules, classify by role, and build the component map
  const moduleEntries = await ssrGlob<Partial<{ default: AnyComponent }>>(projectDir, routesDir, server)
  const { componentMap, allComponents, allPaths } = buildComponentMap(classifyByRole(moduleEntries))

  // Create router and collect diagnostics
  const { modulePaths, pageEndpoints, diagnostics } = createRouter(allPaths)

  // Collect additional runtime diagnostics
  diagnostics.push(...validateComponentExports(modulePaths, allComponents))
  diagnostics.push(...validateAsyncPages(pageEndpoints, componentMap))
  return { diagnostics, modulePaths }
}

/** Reports route compilation and validation diagnostics for the app directory.
 *
 *  @param projectDir - Project directory containing the app directory.
 *  @param routesDir - App route directory relative to the project directory.
 *  @param server - Existing dev server to reuse; otherwise, one is created for this call.
 *  @returns A formatted summary of route diagnostics. */
export async function reportRouteDiagnostics(projectDir: string, routesDir: string, server?: ViteDevServer): Promise<DiagnosticReport> {
  if (!existsSync(join(projectDir, routesDir)))
    return { warnings: [], error: `No such directory: '${routesDir}'`, routes: [] }

  const { diagnostics, modulePaths } = await diagnoseRoutes(projectDir, routesDir, server)
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
