import type { Plugin } from 'vite'
import type { PluginOptions } from './types/plugin-options'
import { transform } from 'oxc-transform-react'
import { APP_DIR_TOKEN, ENTRY_MODULE_ID, INK_OPTIONS_TOKEN, RESOLVED_ENTRY_MODULE_ID } from '@/pen-cli/constants'
import * as log from '@/pen-cli/logger/console'
import entryAppSource from './templates/entry-app.tsx.txt' with { type: 'text' }

/**
 * Loads the app's virtual entry module, which renders the dev server's
 * live Ink UI.
 *
 * Runs only in the SSR environment. Marked `sequential` and ordered after
 * diagnose-plugin.ts in the dev server's plugin array, so "Ready" only
 * prints once route diagnostics have passed - see diagnose-plugin.ts.
 *
 * `perEnvironmentStartEndDuringDev` is needed for the same reason as in
 * diagnose-plugin.ts - without it, this plugin's buildStart (and the
 * "Ready" print in it) would never run on the dev server's SSR environment.
 *
 * `ink` is read lazily off `options` inside `load()` rather than
 * destructured here, since pen:config's `config` hook (which populates it)
 * hasn't necessarily run yet at the time this factory itself is called.
 */
export function penDev(options: PluginOptions): Plugin {
  return {
    name: 'pen:dev',
    perEnvironmentStartEndDuringDev: true,

    // Only runs this plugin's hooks for the SSR environment, not the client one
    applyToEnvironment(environment) {
      return environment.name === 'ssr'
    },
    // Each plugin's resolveId is called and stops at the first one
    // that returns any string. Any string marks it as claimed, the `\0`
    // is just a convention marking the id as a virtual module.
    resolveId(id) {
      if (id === ENTRY_MODULE_ID)
        return RESOLVED_ENTRY_MODULE_ID
    },
    // Same first-hit search again, but over the resolved id, not the
    // original one. This is why it checks RESOLVED_ENTRY_MODULE_ID.
    //
    // Vite's built-in TS/JSX transform refuses any `\0`-prefixed id by
    // design (createFilter: `if (id.includes('\0')) return false`), so
    // nothing else will ever strip this source's TypeScript/JSX - load()
    // has to hand back already-transformed code itself.
    async load(id) {
      if (id === RESOLVED_ENTRY_MODULE_ID) {
        const source = entryAppSource
          .replaceAll(APP_DIR_TOKEN, options.routesDir)
          .replaceAll(INK_OPTIONS_TOKEN, JSON.stringify(options.ink ?? {}))
        const transformed = await transform(ENTRY_MODULE_ID, source, {
          jsx: { development: true },
          reactCompiler: false,  // oxc-transform-react defaults this to true when omitted
          sourcemap: true,  // transformWithOxc generated one by default; this doesn't
        })
        if (transformed.fatal)
          this.error(transformed.errors.map(e => e.message).join('\n'))
        return transformed
      }
    },
    buildStart: {
      sequential: true,
      handler() {
        log.ready(`ready in ${Date.now() - options.startTime}ms`)
      },
    },
  }
}
