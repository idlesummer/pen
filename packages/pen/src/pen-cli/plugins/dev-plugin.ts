import type { Plugin, ViteDevServer } from 'vite'
import type { PluginOptions } from './types/plugin-options'
import { transform } from 'oxc-transform-react'
import { globRoutePaths } from '@/lib/glob-route-paths'
import { stripRegion } from '@/lib/strip-regions'
import { watchRouteFiles } from '@/lib/watch-route-files'
import { APP_DIR_TOKEN, ENTRY_MODULE_ID, INITIAL_PATHS_TOKEN, INK_OPTIONS_TOKEN, RESOLVED_ENTRY_MODULE_ID } from '@/pen-cli/constants'
import * as log from '@/pen-cli/logger/console'
import { createDiagnosticReport } from '@/pen-react/diagnostics'
import { ROUTES_CHANGED_EVENT } from '@/pen-react/renderer'
import entryAppTemplate from './templates/entry-app.dev.tsx.txt' with { type: 'text' }
import { loadModuleRegistry } from './module-registry'

/**
 * Validates the app's routes, then loads its virtual entry module, which
 * renders the dev server's live Ink UI.
 *
 * Runs only in the SSR environment. `buildStart` validates first and fails
 * fast via `this.error`, so "Ready" only prints once that passes. Later
 * route changes are validated differently: the entry module's own
 * ROUTES_CHANGED_EVENT handler already loads a fresh registry to re-render
 * with, so it reports diagnostics on that same registry (see
 * entry-app.dev.tsx.txt) instead of this plugin loading a second copy
 * just to check it.
 *
 * `perEnvironmentStartEndDuringDev` is needed because Vite otherwise only
 * invokes `buildStart` for the client environment during development.
 *
 * `options.config` is read lazily inside `load()` rather than destructured
 * here, since pen:config's `config` hook replaces it with the real
 * settings sometime after this factory itself is called.
 */
export function penDev(options: PluginOptions): Plugin {
  let devServer: ViteDevServer | undefined

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
        const projectDir = this.environment.config.root
        const initialPaths = globRoutePaths(projectDir, options.routesDir)

        // appDir is JSON-quoted here (unlike build-plugin's own raw
        // substitution of the same token) since it becomes a real `const
        // appDir = ...` the entry template passes around as a value, not
        // just a path fragment embedded in one string.
        const source = stripRegion(entryAppTemplate, 'codegen')
          .replaceAll(APP_DIR_TOKEN, JSON.stringify(options.routesDir))
          .replaceAll(INK_OPTIONS_TOKEN, JSON.stringify(options.config.ink))
          .replaceAll(INITIAL_PATHS_TOKEN, JSON.stringify(initialPaths))

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
    // Captures the running server so buildStart's validation load can reuse
    // it instead of spinning up its own throwaway one, and watches route
    // files to keep the already-running Ink UI in sync with ones added or
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
      devServer = server
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
    // Validates the route tree before anything boots - sequential so
    // "Ready" only prints once diagnostics pass.
    buildStart: {
      sequential: true,
      async handler() {
        const projectDir = this.environment.config.root

        // Non-null: configureServer always runs before buildStart in dev, so
        // devServer is already set by the time this handler runs.
        const moduleRegistry = await loadModuleRegistry(projectDir, options.routesDir, devServer!)
        const [warnings, error] = moduleRegistry
          ? createDiagnosticReport(moduleRegistry, options.routesDir)
          : [[], `No such directory: '${options.routesDir}'`]

        for (const message of warnings)
          this.warn(message)
        if (error)
          this.error(error)

        log.ready(`ready in ${Date.now() - options.startTime}ms`)
      },
    },
  }
}
