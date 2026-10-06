import type { Plugin } from 'vite'
import { transformWithOxc } from 'vite'
import { CLI_NAME, VERSION } from '@/lib/constants'
import { APP_DIR_TOKEN, ENTRY_MODULE_ID, RESOLVED_ENTRY_MODULE_ID } from '@/pen-cli/constants'
import * as log from '@/pen-cli/logger/console'
import { reportRouteDiagnostics } from '@/pen-react/setup'
import entryAppSource from './templates/entry-app.tsx.txt' with { type: 'text' }

/**
 * Loads the app's route modules, compiles their paths, and validates the
 * resulting routes before the dev server starts serving requests.
 *
 * Runs only in the SSR environment.
 *
 * @param appDir - App route directory relative to the project root.
 */
export function penDev(appDir: string): Plugin {
  const startTime = Date.now()

  return {
    name: 'pen:dev',

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
        const source = entryAppSource.replaceAll(APP_DIR_TOKEN, appDir)
        const { code, map } = await transformWithOxc(source, ENTRY_MODULE_ID, { jsx: { development: true } })
        return { code, map }
      }
    },
    // Discovers the app's routes, validates them, and reports any errors before the server starts
    async configureServer(server) {
      log.print('')
      log.banner(`${CLI_NAME} v${VERSION}`)
      log.print('')

      const projectDir = server.config.root
      const { warnings, error } = await reportRouteDiagnostics(projectDir, appDir)
      for (const message of warnings)
        log.warn(message)
      if (error) {
        log.error(error)
        throw new Error(error)
      }

      log.ready(`Ready in ${Date.now() - startTime}ms`)
    },
  }
}
