import type { Plugin } from 'vite'
import type { ModuleLoader } from '@/lib/module'
import type { BuildPluginOptions } from './index'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createServer, normalizePath } from 'vite'
import { createDiagnosticReport } from '@/pen-react/diagnostics'
import { createModuleRegistry } from '@/pen-react/modules'

/** Discovers and validates routes before typechecking and bundling.
 *
 *  Runs only during `pen build` in the SSR environment. `pen dev` performs
 *  its own validation using the existing dev server.
 *
 *  Runs sequentially before `penTypecheck` to fail fast on route errors.
 */
export function penDiagnose({ appDir }: BuildPluginOptions): Plugin {
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

        // No dev server running during build
        const server = await createServer({
          root: projectDir,
          configFile: false,
          logLevel: 'silent',
          server: { middlewareMode: true },
        })
        try {
          const moduleLoader: ModuleLoader = (path) => server.ssrLoadModule(`/${normalizePath(path)}`)
          const moduleRegistry = await createModuleRegistry(appDir, moduleLoader)
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
