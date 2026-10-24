import type { Plugin } from 'vite'
import type { PluginOptions } from './types/plugin-options'
import { transform } from 'oxc-transform-react'
import { globRoutePaths } from '@/lib/glob-route-paths'
import { stripCodegenArtifacts } from '@/lib/strip-codegen-artifacts'
import { watchRouteFiles } from '@/lib/watch-route-files'
import { APP_DIR_TOKEN, ENTRY_MODULE_ID, INK_OPTIONS_TOKEN, RESOLVED_ENTRY_MODULE_ID } from '@/pen-cli/constants'
import * as log from '@/pen-cli/logger/console'
import { ROUTES_CHANGED_EVENT } from '@/pen-react/setup'
import entryAppTemplate from './templates/entry-app.tsx.txt' with { type: 'text' }

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
    },
    // Same first-hit search again, but over the resolved id, not the
    // original one. This is why it checks RESOLVED_ENTRY_MODULE_ID.
    async load(id) {
      if (id === RESOLVED_ENTRY_MODULE_ID) {
        const source = stripCodegenArtifacts(entryAppTemplate)
          .replaceAll(APP_DIR_TOKEN, options.routesDir)
          .replaceAll(INK_OPTIONS_TOKEN, JSON.stringify(options.config.ink))

        const transformed = await transform(ENTRY_MODULE_ID, source, {
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
    // removed mid-session - buildStart only loads the registry once, at
    // server start, and the live Ink session never re-imports the entry
    // module afterward, so its component matcher would otherwise go stale.
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
