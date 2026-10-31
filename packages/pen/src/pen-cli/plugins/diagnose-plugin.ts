import type { Plugin, ViteDevServer } from 'vite'
import type { PluginOptions } from './types/plugin-options'
import * as log from '@/pen-cli/logger/console'
import { watchRouteFiles } from '@/lib/watch-route-files'
import { createDiagnosticReport } from '@/pen-react/diagnostics'
import { loadModuleRegistry } from './module-registry'

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
      watchRouteFiles(server, routesDir, () => {
        // Outside the initial build, so can't throw to fail it like buildStart does - just logs
        loadModuleRegistry(projectDir, routesDir, devServer)
          .then(moduleRegistry => {
            const [warnings, error] = moduleRegistry
              ? createDiagnosticReport(moduleRegistry, routesDir)
              : [[], `No such directory: '${routesDir}'`]

            for (const message of warnings) log.warn(message)
            if (error) log.error(error)
          })
          .catch(err => log.error(String(err)))
      })
    },
    buildStart: {
      sequential: true,
      async handler() {
        const projectDir = this.environment.config.root
        const moduleRegistry = await loadModuleRegistry(projectDir, routesDir, devServer)
        const [warnings, error] = moduleRegistry
          ? createDiagnosticReport(moduleRegistry, routesDir)
          : [[], `No such directory: '${routesDir}'`]

        for (const message of warnings)
          this.warn(message)
        if (error)
          this.error(error)
      },
    },
  }
}
