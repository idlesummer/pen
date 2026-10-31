import type { Plugin } from 'vite'
import type { PluginOptions } from './types/plugin-options'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createServer } from 'vite'
import { ssrGlob } from '@/lib/ssr-glob'
import { createDiagnosticReport } from '@/pen-react/diagnostics'
import { createModuleRegistry } from '@/pen-react/modules'

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
        if (!existsSync(join(projectDir, routesDir)))
          this.error(`No such directory: '${routesDir}'`)

        // No dev server already running during build, unlike pen:dev - this
        // plugin always creates its own throwaway one just for this call.
        const server = await createServer({
          root: projectDir,
          configFile: false,
          logLevel: 'silent',
          server: { middlewareMode: true },
        })
        try {
          // Loads each role's route modules, mirroring production's
          // per-role `import.meta.glob` calls, but through Vite's SSR
          // pipeline so the result reflects whichever route files exist
          // right now - this build-time check is the only thing that has
          // loaded anything yet to validate against.
          const options = { base: routesDir, server }
          const moduleRegistry = await createModuleRegistry({
            page: ssrGlob('**/page.tsx', options),
            layout: ssrGlob('**/layout.tsx', options),
            loading: ssrGlob('**/loading.tsx', options),
            error: ssrGlob('**/error.tsx', options),
            default: ssrGlob('**/default.tsx', options),
          })
          const [warnings, error] = createDiagnosticReport(moduleRegistry, routesDir)

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
