import type { Plugin } from 'vite'
import type { PluginOptions } from './types/plugin-options'
import { createServer } from 'vite'
import { createDiagnosticReport } from '@/pen-react/diagnostics'
import { loadModuleRegistry } from './module-registry'

/** Discovers and validates the app's routes before typechecking and bundling.
 *
 *  Runs only during `pen build`, in the SSR environment - `pen dev` does its
 *  own equivalent validation directly in dev-plugin.ts, reusing the dev
 *  server it already has instead of this plugin spinning up a throwaway one.
 *
 *  Marked `sequential` and ordered before `penTypecheck` so route errors
 *  fail fast before the more expensive `tsc` run.
 *
 *  `perEnvironmentStartEndDuringDev` is required because Vite otherwise only
 *  invokes `buildStart` for the client environment during development. */
export function penDiagnose({ routesDir }: PluginOptions): Plugin {
  return {
    name: 'pen:diagnose',
    perEnvironmentStartEndDuringDev: true,

    applyToEnvironment(environment) {
      return environment.name === 'ssr'
    },
    buildStart: {
      sequential: true,
      async handler() {
        const projectDir = this.environment.config.root

        // No dev server already running during build, unlike pen:dev - this
        // plugin always creates its own throwaway one just for this call.
        const server = await createServer({
          root: projectDir,
          configFile: false,
          logLevel: 'silent',
          server: { middlewareMode: true },
        })
        try {
          const moduleRegistry = await loadModuleRegistry(projectDir, routesDir, server)
          const [warnings, error] = moduleRegistry
            ? createDiagnosticReport(moduleRegistry, routesDir)
            : [[], `No such directory: '${routesDir}'`]

          for (const message of warnings)
            this.warn(message)
          if (error)
            this.error(error)
        }
        finally {
          await server.close()
        }
      },
    },
  }
}
