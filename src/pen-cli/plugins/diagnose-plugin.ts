import type { Plugin } from 'vite'
import { reportRouteDiagnostics } from '@/pen-react/setup'
import type { PluginOptions } from './plugin-options'

/**
 * Discovers the app's routes, validates them, and reports any errors or
 * warnings before the real build starts.
 *
 * Runs only in the SSR environment. Marked `sequential` and ordered before
 * typecheck-plugin.ts in the builder's plugin array - diagnostics are
 * cheaper, so they should fail fast before paying for a `tsc` run.
 *
 * `perEnvironmentStartEndDuringDev` is needed for dev specifically: Vite
 * only fires buildStart for the client environment there by default, for
 * backward compatibility - without this, this plugin's buildStart would
 * never run at all when reused on the dev server.
 */
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
        const { warnings, error } = await reportRouteDiagnostics(projectDir, routesDir)

        for (const message of warnings) this.warn(message)
        if (error) this.error(error)
      },
    },
  }
}
