import type { Plugin } from 'vite'
import type { PluginOptions } from './plugin-options'
import { reportRouteDiagnostics } from '@/pen-react/setup'

/** Discovers and validates the app's routes before typechecking and bundling.
 *
 *  Runs only in the SSR environment. Marked `sequential` and ordered before
 *  `penTypecheck` so route errors fail fast before the more expensive `tsc` run.
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
        const { warnings, error } = await reportRouteDiagnostics(projectDir, routesDir)

        for (const message of warnings) this.warn(message)
        if (error) this.error(error)
      },
    },
  }
}
