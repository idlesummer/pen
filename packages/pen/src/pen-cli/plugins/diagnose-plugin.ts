import type { Plugin } from 'vite'
import type { ModuleLoader } from '@/lib/module'
import type { PluginOptions } from './types/plugin-options'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createServer, normalizePath } from 'vite'
import { createDiagnosticReport } from '@/pen-react/diagnostics'
import { _createModuleRegistry } from '@/pen-react/modules'

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
          const moduleLoader: ModuleLoader = path => server.ssrLoadModule(`/${normalizePath(path)}`)
          const moduleRegistry = await _createModuleRegistry(appDir, moduleLoader)
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
