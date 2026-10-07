import type { Plugin } from 'vite'
import pc from 'picocolors'
import { CLI_NAME, PACKAGE_NAME, VERSION } from '@/lib/constants'
import { APP_DIR_TOKEN, ENTRY_FILE, ENTRY_MODULE_ID, RESOLVED_ENTRY_MODULE_ID } from '@/pen-cli/constants'
import * as log from '@/pen-cli/logger/console'
import { typeCheck } from '@/pen-cli/type-check'
import { reportRouteDiagnostics } from '@/pen-react/setup'
import entryAppSource from './templates/entry-app.tsx.txt' with { type: 'text' }

/** Loads the app's route modules, compiles their paths, and validates the
 *  resulting routes before the build proceeds.
 *
 *  Runs only in the SSR environment.
 *
 *  @param appDir - App route directory relative to the project root. */
export function penBuild(appDir: string): Plugin {
  return {
    name: 'pen:build',

    // Only runs this plugin's hooks for the SSR environment, not the client one
    applyToEnvironment(environment) {
      return environment.name === 'ssr'
    },
    // Supplies the Vite config needed to bundle the entry module for Node
    config() {
      return {
        ssr: { noExternal: [PACKAGE_NAME] },  // Bundle pen's runtime instead of leaving it external
        build: {
          ssr: true,  // Build for Node so imports work instead of being treated as browser code
          rolldownOptions: {  // The entry-app template discovers the user's routes for bundling
            input: ENTRY_MODULE_ID,
            output: { entryFileNames: ENTRY_FILE },
          },
        },
      }
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
    load(id) {
      if (id === RESOLVED_ENTRY_MODULE_ID)
        return entryAppSource.replaceAll(APP_DIR_TOKEN, appDir)
    },
    // Discovers the app's routes, validates them, and reports any errors before the build continues
    async buildStart() {
      log.print('')
      log.banner(`${CLI_NAME} v${VERSION}`)
      log.print('')

      const projectDir = this.environment.config.root
      const { warnings, error, routes } = await reportRouteDiagnostics(projectDir, appDir)
      for (const route of routes)
        log.print(`${pc.dim('•')} ${route}`)
      for (const message of warnings)
        this.warn(message)
      if (error)
        this.error(error)

      const typeErrors = await typeCheck(projectDir)
      if (typeErrors)
        this.error(typeErrors)
    },
  }
}
