import type { Plugin, ViteDevServer } from 'vite'
import type { PluginOptions } from './types/plugin-options'
import { globSync } from 'node:fs'
import { join } from 'node:path'
import { transform } from 'oxc-transform-react'
import { debounce } from '@/lib/debounce'
import { isPathInside } from '@/lib/path'
import { stripRegion } from '@/lib/strip-regions'
import { APP_DIR_TOKEN, ENTRY_MODULE_ID, INITIAL_PATHS_TOKEN, INK_OPTIONS_TOKEN, RESOLVED_ENTRY_MODULE_ID } from '@/pen-cli/constants'
import * as log from '@/pen-cli/logger/console'
import { ROUTES_CHANGED_EVENT } from '@/pen-react/renderer'
import entryAppTemplate from './templates/entry-app.dev.tsx.txt' with { type: 'text' }

const WATCH_DEBOUNCE_MS = 150

/** Lists each role's currently-matching route file paths, without loading
 *  them - just a fresh-off-disk directory scan.
 *
 *  @param projectDir - Project directory containing the app directory.
 *  @param routesDir - App route directory relative to the project directory. */
function globRoutePaths(projectDir: string, routesDir: string) {
  const cwd = join(projectDir, routesDir)
  const glob = (pattern: string) => globSync(pattern, { cwd }).sort()
  return {
    page: glob('**/page.tsx'),
    layout: glob('**/layout.tsx'),
    loading: glob('**/loading.tsx'),
    error: glob('**/error.tsx'),
    default: glob('**/default.tsx'),
  }
}

/** Watches for route `.tsx` files being added or removed under `routesDir`,
 *  debounced into a single call per batch of changes - a multi-file change
 *  (a git checkout, a directory delete) would otherwise trigger the callback
 *  once per file instead of once for the whole batch.
 *
 *  @param server - The dev server whose watcher to listen on.
 *  @param appDir - App route directory relative to the project directory.
 *  @param onChange - Called once, after 150ms of no further route file changes. */
function watchRouteFiles(server: ViteDevServer, appDir: string, onChange: () => void): void {
  const appDirAbsolute = join(server.config.root, appDir)
  const scheduleChange = debounce(onChange, WATCH_DEBOUNCE_MS)
  const onRouteFileChange = (filePath: string) => {
    if (filePath.endsWith('.tsx') && isPathInside(filePath, appDirAbsolute))
      scheduleChange()
  }
  server.watcher.on('add', onRouteFileChange)
  server.watcher.on('unlink', onRouteFileChange)
}

/**
 * Loads the virtual entry module, which validates the app's routes itself
 * on its first load and renders the dev server's live Ink UI.
 *
 * Runs only in the SSR environment. The entry module validates and fails
 * fast on a bad route before it ever renders (see entry-app.dev.tsx.txt) -
 * this plugin doesn't validate anything itself, it just announces the
 * server is up. Later route changes go through the same entry module's
 * own ROUTES_CHANGED_EVENT handler, reusing the registry it already loads
 * to re-render with.
 *
 * `perEnvironmentStartEndDuringDev` is needed because Vite otherwise only
 * invokes `buildStart` for the client environment during development.
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
    // Watches route files to keep the already-running Ink UI in sync with
    // ones added or removed mid-session - the entry module loads its
    // routes once, when it starts, and never re-imports itself afterward,
    // so its component matcher would otherwise go stale as files change.
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
    // Just announces the server is up - the entry module validates routes
    // and reports its own failures once it actually loads, a step later.
    buildStart() {
      log.ready(`ready in ${Date.now() - options.startTime}ms`)
    },
  }
}
