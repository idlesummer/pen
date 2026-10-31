import type { Plugin } from 'vite'
import type { PluginOptions } from './types/plugin-options'
import { transform } from 'oxc-transform-react'
import { globRoutePaths } from '@/lib/glob-route-paths'
import { watchRouteFiles } from '@/lib/watch-route-files'
import { ENTRY_MODULE_ID, RESOLVED_ENTRY_MODULE_ID, RESOLVED_RUNTIME_CONFIG_MODULE_ID, RUNTIME_CONFIG_MODULE_ID } from '@/pen-cli/constants'
import * as log from '@/pen-cli/logger/console'
import { ROUTES_CHANGED_EVENT } from '@/pen-react/renderer'
import entryAppTemplate from './templates/entry-app.dev.tsx.txt' with { type: 'text' }

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
 * `options.config` is read lazily inside `load()` rather than destructured
 * here, since pen:config's `config` hook replaces it with the real
 * settings sometime after this factory itself is called.
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
      if (id === RUNTIME_CONFIG_MODULE_ID)
        return RESOLVED_RUNTIME_CONFIG_MODULE_ID
    },
    // Same first-hit search again, but over the resolved id, not the
    // original one. This is why it checks the resolved ids below.
    async load(id) {
      // Supplies appDir/inkOptions/initialPaths as real exports, generated
      // fresh each time this module loads - lets the entry template import
      // them normally instead of having its own source textually rewritten.
      if (id === RESOLVED_RUNTIME_CONFIG_MODULE_ID) {
        const projectDir = this.environment.config.root
        const initialPaths = globRoutePaths(projectDir, options.routesDir)
        return [
          `export const appDir = ${JSON.stringify(options.routesDir)}`,
          `export const inkOptions = ${JSON.stringify(options.config.ink)}`,
          `export const initialPaths = ${JSON.stringify(initialPaths)}`,
        ].join('\n')
      }
      if (id === RESOLVED_ENTRY_MODULE_ID) {
        const transformed = await transform(ENTRY_MODULE_ID, entryAppTemplate, {
          jsx: { development: true },
          reactCompiler: false,  // since oxc-transform-react defaults to true
          sourcemap: true,  // transformWithOxc generates one by default
        })
        if (transformed.fatal)
          this.error(transformed.errors.map(e => e.message).join('\n'))
        return transformed
      }
    },
    // Keeps the already-running Ink UI in sync with route files added or
    // removed mid-session - the entry module loads its routes once, when
    // it starts, and never re-imports itself afterward, so its component
    // matcher would otherwise go stale as files change.
    //
    // Only sends paths, not loaded modules: loading them here would go
    // through this plugin's own `server.ssrLoadModule`, a separate runtime
    // from the `ServerModuleRunner` actually running the live Ink session -
    // modules loaded through the wrong one are distinct instances, breaking
    // identity-sensitive state like React context shared with the running
    // app. The entry module loads these paths itself once it receives them,
    // through its own runtime, keeping shared dependencies consistent.
    configureServer(server) {
      watchRouteFiles(server, options.routesDir, () => {
        try {
          const paths = globRoutePaths(server.config.root, options.routesDir)
          server.environments.ssr!.hot.send(ROUTES_CHANGED_EVENT, paths)
        }
        catch (err) {
          log.error(String(err))
        }
      })
    },
    buildStart: {
      sequential: true,
      handler() {
        log.ready(`ready in ${Date.now() - options.startTime}ms`)
      },
    },
  }
}
