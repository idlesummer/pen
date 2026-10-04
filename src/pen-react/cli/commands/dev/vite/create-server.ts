import { sep } from 'node:path'
import { createServer } from 'vite'
import { findProjectRoot } from '@/lib/find-project-root'
import { pen } from './dev-plugin'

/** Creates a Vite dev server configured with the `pen` plugin, ready to
 *  serve the app's SSR environment.
 *
 *  Runs as a headless transform-and-watch engine - no HTTP server, no
 *  browser, no client environment - driving a Node/terminal program
 *  through a module runner instead.
 *
 *  @param appDir - App route directory relative to the project root. */
export function createPenDevServer(appDir: string) {
  return createServer({
    root: findProjectRoot(process.cwd() + sep),
    configFile: false,
    plugins: [pen(appDir)],
    server: {
      middlewareMode: true,  // don't open an HTTP server
      ws: false,  // no HMR socket; the ssr environment's HMR is in-process
    },
    // Vite always creates an unused browser-style `client` environment.
    // Without this its dependency optimizer starts and writes
    // node_modules/.vite for nothing.
    optimizeDeps: { noDiscovery: true },
  })
}
