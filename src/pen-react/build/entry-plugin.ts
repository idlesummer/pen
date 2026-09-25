import type { Plugin } from 'vite'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Virtual module ID for the entry template. */
export const ENTRY_MODULE_ID = 'virtual:pen/entry-app.tsx'
const RESOLVED_ENTRY_MODULE_ID = `\0${ENTRY_MODULE_ID}`
const APP_DIR_TOKEN = '__PEN_APP_DIR__'

/**
 * Provides the virtual entry module used to discover and bundle the app's
 * route files. The entry template contains the glob pattern, with appDir
 * substituted at build time.
 *
 * @param appDir App route directory relative to project root.
 */
export function entryPlugin(appDir: string): Plugin {
  return {
    name: 'pen:entry-app',
    resolveId: (id) => {
      if (id === ENTRY_MODULE_ID)
        return RESOLVED_ENTRY_MODULE_ID
    },
    load: (id) => {
      if (id !== RESOLVED_ENTRY_MODULE_ID)
        return

      const templatePath = join(import.meta.dirname, 'templates/entry-app.tsx')
      const source = readFileSync(templatePath, 'utf-8')
      return source.replaceAll(APP_DIR_TOKEN, appDir)
    },
  }
}
