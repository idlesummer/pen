import type { Plugin } from 'vite'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { transformWithOxc } from 'vite'
import { APP_DIR_TOKEN, ENTRY_MODULE_ID, RESOLVED_ENTRY_MODULE_ID } from '@/pen-react/cli/constants'
import { discoverRoutes } from '@/pen-react/runtime'
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
  return {
    name: 'pen:dev',

    // Only runs this plugin's hooks for the SSR environment, not the client one
    applyToEnvironment(environment) {
      return environment.name === 'ssr'
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
