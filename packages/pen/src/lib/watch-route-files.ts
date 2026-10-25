import type { ViteDevServer } from 'vite'
import { join, relative, sep } from 'node:path'

const WATCH_DEBOUNCE_MS = 150

/** Checks whether a path is equal to or contained within a base path.
 *  @param path - The path to check.
 *  @param base - The base path.
 *  @returns Whether the path is relative to the base path. */
function isPathRelativeTo(path: string, base: string): boolean {
  const relativePath = relative(base, path)
  return relativePath !== '..' && !relativePath.startsWith(`..${sep}`)
}

/** Watches for route `.tsx` files being added or removed under `routesDir`,
 *  debounced into a single call per batch of changes - a multi-file change
 *  (a git checkout, a directory delete) would otherwise trigger the callback
 *  once per file instead of once for the whole batch.
 *
 *  @param server - The dev server whose watcher to listen on.
 *  @param routesDir - App route directory relative to the project directory.
 *  @param onChange - Called once, after 150ms of no further route file changes. */
export function watchRouteFiles(server: ViteDevServer, routesDir: string, onChange: () => void): void {
  const routesPath = join(server.config.root, routesDir)
  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  const onRouteFileChange = (filePath: string) => {
    if (!filePath.endsWith('.tsx')) return
    if (!isPathRelativeTo(filePath, routesPath)) return

    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(onChange, WATCH_DEBOUNCE_MS)
  }
  server.watcher.on('add', onRouteFileChange)
  server.watcher.on('unlink', onRouteFileChange)
}
