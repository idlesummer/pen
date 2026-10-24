import type { Plugin, ViteDevServer } from 'vite'
import type { ModuleRegistry } from '@/pen-react/modules'
import type { DiagnosticReport } from '@/pen-react/diagnostics'
import type { PluginOptions } from './types/plugin-options'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { createServer } from 'vite'
import { isPathRelativeTo } from '@/lib/path'
import * as log from '@/pen-cli/logger/console'
import { ssrGlob } from '@/lib/ssr-glob'
import { createDiagnosticReport } from '@/pen-react/diagnostics'

const WATCH_DEBOUNCE_MS = 150

/** Loads each role's route modules directly, mirroring production's per-role `import.meta.glob` calls. */
async function createModuleRegistry(routesDir: string, server: ViteDevServer): Promise<ModuleRegistry> {
  const options = { base: routesDir, server }
  const [page, layout, loading, error, default_] = await Promise.all([
    ssrGlob('**/page.tsx', options),
    ssrGlob('**/layout.tsx', options),
    ssrGlob('**/loading.tsx', options),
    ssrGlob('**/error.tsx', options),
    ssrGlob('**/default.tsx', options),
  ])
  return { page, layout, loading, error, default: default_ }
}

/** Scans the app directory for route modules and reports diagnostics from
 *  route compilation and validation. Shared by `pen build` (once per build)
 *  and `pen dev` (once per file add/delete).
 *
 *  @param projectDir - Project directory containing the app directory.
 *  @param routesDir - App route directory relative to the project directory.
 *  @param server - An existing dev server to reuse, if one is already running.
 *  @returns A formatted summary of route diagnostics. */
async function diagnoseRoutes(projectDir: string, routesDir: string, server?: ViteDevServer): Promise<DiagnosticReport> {
  if (!existsSync(join(projectDir, routesDir)))
    return [[], `No such directory: '${routesDir}'`]

  const devServer = server ?? await createServer({
    root: projectDir,
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true },
  })
  try {
    const moduleRegistry = await createModuleRegistry(routesDir, devServer)
    const report = createDiagnosticReport(moduleRegistry, routesDir)
    return report
  }
  finally {
    if (!server)  // close server only if its created in this function
      await devServer.close()  // only close servers created for this call
  }
}

/** Discovers and validates the app's routes before typechecking and bundling.
 *
 *  Runs only in the SSR environment. Marked `sequential` and ordered before
 *  `penTypecheck` so route errors fail fast before the more expensive `tsc` run.
 *
 *  `perEnvironmentStartEndDuringDev` is required because Vite otherwise only
 *  invokes `buildStart` for the client environment during development.
 *
 *  Vite's own reactivity (HMR, `import.meta.glob` full-reloads) only covers
 *  files already known to the module graph, so a brand new route file -
 *  never imported yet - needs the watcher's raw add/unlink events instead;
 *  `buildStart` alone only runs once, at server start. */
export function penDiagnose({ routesDir }: PluginOptions): Plugin {
  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  let devServer: ViteDevServer | undefined

  return {
    name: 'pen:diagnose',
    perEnvironmentStartEndDuringDev: true,

    applyToEnvironment(environment) {
      return environment.name === 'ssr'
    },
    configureServer(server) {
      devServer = server
      const projectDir = server.config.root
      const onRouteFileChange = (filePath: string) => {
        if (!filePath.endsWith('.tsx')) return
        if (!isPathRelativeTo(filePath, join(projectDir, routesDir))) return

        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          // Outside the initial build, so can't throw to fail it like buildStart does - just logs
          diagnoseRoutes(projectDir, routesDir, devServer)
            .then(([warnings, error]) => {
              for (const message of warnings) log.warn(message)
              if (error) log.error(error)
            })
            .catch(err => log.error(String(err)))
        }, WATCH_DEBOUNCE_MS)
      }
      server.watcher.on('add', onRouteFileChange)
      server.watcher.on('unlink', onRouteFileChange)
    },
    buildStart: {
      sequential: true,
      async handler() {
        const projectDir = this.environment.config.root
        const [warnings, error] = await diagnoseRoutes(projectDir, routesDir, devServer)

        for (const message of warnings)
          this.warn(message)

        if (error)
          this.error(error)
      },
    },
  }
}
