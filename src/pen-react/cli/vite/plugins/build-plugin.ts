import type { Plugin } from 'vite'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { PACKAGE_NAME } from '@/lib/constants'
import { APP_DIR_TOKEN, ENTRY_FILE, ENTRY_MODULE_ID, RESOLVED_ENTRY_MODULE_ID } from '@/pen-react/cli/constants'
import { discoverRoutes } from '@/pen-react/runtime'
import entryAppSource from './templates/entry-app.tsx.txt' with { type: 'text' }

/**
 * Loads the app's route modules, compiles their paths, and validates the
 * resulting routes before the build proceeds.
 *
 * Runs only in the SSR environment.
 *
 * @param appDir - App route directory relative to the project root.
 */
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

    // Vite tries each plugin's resolveId in turn and stops at the first one
    // that returns any string. Any string marks it as claimed - the `\0`
    // is just a convention marking the id as fake so nothing treats it
    // like a real file path.
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
      // existsSync is a plain Node fs call - Vite's own root option doesn't
      // reach it, so root is read explicitly and joined by hand
      const projectDir = this.environment.config.root
      if (!existsSync(join(projectDir, appDir)))
        this.error(`No such directory: '${appDir}'`)

      const { diagnostics } = await discoverRoutes(projectDir, appDir)

      // Display diagnostics
      for (const { severity, message, files } of diagnostics)
        if (severity === 'warn')
          this.warn({ message, ids: files })

      const errors = diagnostics.filter(d => d.severity === 'error')
      if (errors.length) {
        const message = errors.map(d => d.message).join('\n\n')
        const ids = [...new Set(errors.flatMap(d => d.files))]
        this.error({ message, ids })
      }
    },
  }
}
