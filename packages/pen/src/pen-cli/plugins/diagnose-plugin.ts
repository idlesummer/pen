import type { Plugin, ViteDevServer } from 'vite'
import type { PluginOptions } from './types/plugin-options'
import { join, relative } from 'node:path'
import * as log from '@/pen-cli/logger/console'
import { reportRouteDiagnostics } from '@/pen-react/diagnostics'

const WATCH_DEBOUNCE_MS = 150

/** Re-checks routes outside the initial build - a watcher-triggered check
 *  can't throw to fail a build like buildStart does, so it just logs. */
async function logRouteDiagnostics(projectDir: string, routesDir: string, server?: ViteDevServer) {
  const [warnings, error] = await reportRouteDiagnostics(projectDir, routesDir, server)
  for (const message of warnings) log.warn(message)
  if (error) log.error(error)
}

/** True for a path inside `dir`. */
function isInside(filePath: string, dir: string): boolean {
  return !relative(dir, filePath).startsWith('..')
}

/** Discovers and validates the app's routes before typechecking and bundling.
 *
 *  Runs only in the SSR environment. Marked `sequential` and ordered before
 *  `penTypecheck` so route errors fail fast before the more expensive `tsc` run.
 *
 *  `perEnvironmentStartEndDuringDev` is required because Vite otherwise only
 *  invokes `buildStart` for the client environment during development.
 *
 *  Vite's own reactivity (HMR, `import.meta.glob` full-reloads) only covers
 *  files already known to the module graph, so a brand new route file -
 *  never imported yet - needs the watcher's raw add/unlink events instead;
 *  `buildStart` alone only runs once, at server start. */
export function penDiagnose({ routesDir }: PluginOptions): Plugin {
  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  // Set only in configureServer, which never runs for `pen build` (createBuilder
  // has no dev server) - buildStart there correctly falls back to a throwaway one.
  let devServer: ViteDevServer | undefined

  return {
    name: 'pen:diagnose',
    perEnvironmentStartEndDuringDev: true,

    applyToEnvironment(environment) {
      return environment.name === 'ssr'
    },
    configureServer(server) {
      devServer = server
      const projectDir = server.config.root
      const routesDirAbs = join(projectDir, routesDir)

      const onRouteFileChange = (filePath: string) => {
        if (!filePath.endsWith('.tsx') || !isInside(filePath, routesDirAbs)) return

        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          logRouteDiagnostics(projectDir, routesDir, devServer).catch(err => log.error(String(err)))
        }, WATCH_DEBOUNCE_MS)
      }
      server.watcher.on('add', onRouteFileChange)
      server.watcher.on('unlink', onRouteFileChange)
    },
    buildStart: {
      sequential: true,
      async handler() {
        const projectDir = this.environment.config.root
        const [warnings, error] = await reportRouteDiagnostics(projectDir, routesDir, devServer)

        for (const message of warnings) this.warn(message)
        if (error) this.error(error)
      },
    },
  }
}
