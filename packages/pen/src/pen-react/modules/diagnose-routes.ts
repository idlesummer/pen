import type { Module } from '@/lib/module'
import type { Diagnostic } from '@/pen-core'
import type { ViteDevServer } from 'vite'
import type { AnyComponent } from './component-map'
import type { ModuleRegistry } from './module-registry'
import { basename, join } from 'node:path'
import { existsSync } from 'node:fs'
import { ssrGlob } from '@/lib/ssr-glob'
import { createRouter, getModuleRole, GLOBAL_DEFAULT, GLOBAL_ERROR } from '@/pen-core'
import { createComponentMap } from './component-map'
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
function classifyByRole(modules: Record<string, Partial<Module<AnyComponent>>>): ModuleRegistry {
  const byRole: ModuleRegistry = { page: {}, layout: {}, loading: {}, error: {}, default: {} }
  for (const [path, module] of Object.entries(modules)) {
    const role = getModuleRole(basename(path))
    if (role === 'page') byRole.page[path] = module
    else if (role === 'layout') byRole.layout[path] = module
    else if (role === 'loading') byRole.loading[path] = module
    else if (role === 'error') byRole.error[path] = module
    else if (role === 'default') byRole.default[path] = module
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
  const modules = await ssrGlob<Partial<Module<AnyComponent>>>(projectDir, routesDir, server)
  const { componentMap, componentPaths } = createComponentMap(classifyByRole(modules))

  // Create router and collect diagnostics
  const { modulePaths, pageEndpoints, diagnostics } = createRouter(componentPaths)

  // Collect additional runtime diagnostics - validateComponentExports doesn't
  // care which role a path belongs to, so flatten componentMap just for this check
  const components: Record<string, AnyComponent> = Object.assign({}, ...Object.values(componentMap))
  diagnostics.push(...validateComponentExports(modulePaths, components))
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
