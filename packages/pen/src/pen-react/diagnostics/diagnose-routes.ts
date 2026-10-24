import type { ViteDevServer } from 'vite'
import type { Diagnostic } from '@/pen-core'
import type { ModuleRegistry } from '@/pen-react/modules'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { createServer } from 'vite'
import { ssrGlob } from '@/lib/ssr-glob'
import { createDiagnostic, createRouter } from '@/pen-core'
import { createComponentMap } from '@/pen-react/modules'
import { validateAsyncPages, validateComponentExports } from './validate'

/** Re-derives a diagnostic's message with its files shown relative to the
 *  project root (app dir included) instead of the app dir alone - otherwise
 *  they look route-shaped but aren't actually openable from where the build runs. */
function formatDiagnostic(diagnostic: Diagnostic, routesDir: string): string {
  const files = diagnostic.files.map(file => `${routesDir}/${file}`)
  return createDiagnostic({ ...diagnostic, files }).message
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
async function diagnoseRoutes(projectDir: string, routesDir: string, server?: ViteDevServer): Promise<Diagnostic[]> {
  const activeServer = server ?? await createServer({
    root: projectDir,
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true },
  })
  try {
    // Load each role's modules directly and build the component map
    const options = { base: routesDir, server: activeServer }
    const [page, layout, loading, error, default_] = await Promise.all([
      ssrGlob('**/page.tsx', options),
      ssrGlob('**/layout.tsx', options),
      ssrGlob('**/loading.tsx', options),
      ssrGlob('**/error.tsx', options),
      ssrGlob('**/default.tsx', options),
    ])
    const moduleRegistry: ModuleRegistry = { page, layout, loading, error, default: default_ }
    const [componentMap, componentPaths] = createComponentMap(moduleRegistry)

    // Create router and collect diagnostics
    const { pageEndpoints, diagnostics } = createRouter(componentPaths)

    // Collect additional runtime diagnostics
    diagnostics.push(...validateComponentExports(componentMap))
    diagnostics.push(...validateAsyncPages(pageEndpoints, componentMap))
    return diagnostics
  }
  finally {
    if (!server)
      await activeServer.close()  // only close servers created for this call
  }
}

/** Reports route compilation and validation diagnostics for the app directory.
 *
 *  @param projectDir - Project directory containing the app directory.
 *  @param routesDir - App route directory relative to the project directory.
 *  @param server - Existing dev server to reuse; otherwise, one is created for this call.
 *  @returns A formatted summary of route diagnostics. */
export async function reportRouteDiagnostics(projectDir: string, routesDir: string, server?: ViteDevServer): Promise<[warnings: string[], error: string | undefined]> {
  if (!existsSync(join(projectDir, routesDir)))
    return [[], `No such directory: '${routesDir}'`]

  const diagnostics = await diagnoseRoutes(projectDir, routesDir, server)
  const warnings = diagnostics
    .filter(d => d.severity === 'warn')
    .map(d => formatDiagnostic(d, routesDir))

  const error = diagnostics
    .filter(d => d.severity === 'error')
    .map(d => formatDiagnostic(d, routesDir))
    .join('\n\n') || undefined  // Works since empty strings are falsy

  return [warnings, error]
}
