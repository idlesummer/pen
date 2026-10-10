import type { PluginOptions } from '@/pen-cli/plugins'
import { createServer } from 'vite'
import { APP_DIR_NAME, CLI_NAME, VERSION } from '@/lib/constants'
import { findPackageDir } from '@/lib/find-package-dir'
import { createPenLogger } from '@/pen-cli/logger/adapter'
import * as log from '@/pen-cli/logger/console'
import { penConfig, penDev, penDiagnose, penRefresh } from '@/pen-cli/plugins'

/** Creates a Vite dev server configured with the `pen` plugin, ready to
 *  serve the app's SSR environment.
 *
 *  Runs as a headless transform-and-watch engine - no HTTP server, no
 *  browser, no client environment - driving a Node/terminal program
 *  through a module runner instead.
 *
 *  @param srcDir - Directory containing the app directory, relative to the project root. */
export function createPenDevServer(srcDir: string) {
  log.banner(`${CLI_NAME} v${VERSION}`)

  const projectDir = findPackageDir(process.cwd())
  if (!projectDir) {
    log.error('Could not find a package.json from the current directory.')
    process.exit(1)
  }
  const routesDir = `${srcDir}/${APP_DIR_NAME}`
  const startTime = Date.now()
  const options: PluginOptions = { routesDir, startTime }

  return createServer({
    root: projectDir,
    configFile: false,
    customLogger: createPenLogger(),
    clearScreen: false,  // Ink owns the terminal, not Vite
    plugins: [
      penConfig(options),
      penDiagnose(options),
      penDev(options),
      penRefresh(options),
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
