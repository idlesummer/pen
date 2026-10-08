import { sep } from 'node:path'
import { createServer } from 'vite'
import { APP_DIR_NAME } from '@/lib/constants'
import { findProjectRoot } from '@/lib/find-project-root'
import { createPenLogger } from '@/pen-cli/logger/adapter'
import { penDev } from '@/pen-cli/plugins/dev-plugin'
import { penReactRefreshInk } from '@/pen-cli/plugins/refresh-ink-plugin'

/** Creates a Vite dev server configured with the `pen` plugin, ready to
 *  serve the app's SSR environment.
 *
 *  Runs as a headless transform-and-watch engine - no HTTP server, no
 *  browser, no client environment - driving a Node/terminal program
 *  through a module runner instead.
 *
 *  @param srcDir - Directory containing the app directory, relative to the project root. */
export function createPenDevServer(srcDir: string) {
  const routesDir = `${srcDir}/${APP_DIR_NAME}`
  return createServer({
    root: findProjectRoot(process.cwd() + sep),
    configFile: false,
    customLogger: createPenLogger(),
    clearScreen: false,  // Ink owns the terminal, not Vite
    plugins: [
      penDev(routesDir),
      penReactRefreshInk(),
    ],
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
