import type { Plugin } from 'vite'
import { reportRouteDiagnostics } from '@/pen-react/setup'

/**
 * Discovers the app's routes, validates them, and reports any errors or
 * warnings before the real build starts.
 *
 * Exits directly on failure instead of going through `this.error()`,
 * which would otherwise wrap the message in rolldown's own stack trace.
 *
 * Runs only in the SSR environment. Marked `sequential` and ordered before
 * typecheck-plugin.ts in the builder's plugin array - diagnostics are
 * cheaper, so they should fail fast before paying for a `tsc` run.
 */
export function penDiagnose(): Plugin {
  return {
    name: 'pen:diagnose',

    applyToEnvironment(environment) {
      return environment.name === 'ssr'
    },
    buildStart: {
      sequential: true,
      async handler() {
        const { warnings, error } = await reportRouteDiagnostics(this.environment.config.root)
        for (const message of warnings)
          this.warn(message)
        if (error) {
          this.error(error)
        }
      },
    },
  }
}
