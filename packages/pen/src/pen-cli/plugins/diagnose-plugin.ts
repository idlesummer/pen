import type { Plugin, ViteDevServer } from 'vite'
import type { PluginOptions } from './types/plugin-options'
import type { ModuleRegistry } from '@/pen-react/modules'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createServer } from 'vite'
import { ssrGlob } from '@/lib/ssr-glob'
import { createDiagnosticReport } from '@/pen-react/diagnostics'
import { createModuleRegistry } from '@/pen-react/modules'

/** Globs each role's route files under appDir and loads them through
 *  Vite's SSR pipeline, assembling the result into a ModuleRegistry -
 *  mirrors production's per-role `import.meta.glob` calls, but reflects
 *  whichever route files exist right now instead of a static snapshot.
 *
 *  @param appDir - App route directory relative to the project root.
 *  @param server - Dev server to load route modules through. */
async function createModuleRegistryFromSsrGlob(appDir: string, server: ViteDevServer): Promise<ModuleRegistry> {
  const options = { base: appDir, server }
  return createModuleRegistry({
    page: ssrGlob('**/page.tsx', options),
    layout: ssrGlob('**/layout.tsx', options),
    loading: ssrGlob('**/loading.tsx', options),
    error: ssrGlob('**/error.tsx', options),
    default: ssrGlob('**/default.tsx', options),
  })
}

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
export function penDiagnose({ appDir }: PluginOptions): Plugin {
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
        if (!existsSync(join(projectDir, appDir)))
          this.error(`No such directory: '${appDir}'`)

        // No dev server already running during build, unlike pen:dev - this
        // plugin always creates its own throwaway one just for this call.
        const server = await createServer({
          root: projectDir,
          configFile: false,
          logLevel: 'silent',
          server: { middlewareMode: true },
        })
        try {
          const moduleRegistry = await createModuleRegistryFromSsrGlob(appDir, server)
          const [warnings, error] = createDiagnosticReport(moduleRegistry, appDir)

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
