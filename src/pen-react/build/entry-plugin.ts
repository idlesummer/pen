import type { Plugin } from 'vite'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// .tsx suffix required - Vite/rolldown pick a parser by file extension, and
// a virtual id with none would be parsed as plain JS, choking on JSX syntax.
const ENTRY_ID = 'virtual:pen/entry-app.tsx'
const RESOLVED_ENTRY_ID = `\0${ENTRY_ID}`
const APP_DIR_TOKEN = '__PEN_APP_DIR__'

/** Vite/rolldown input id for the entry template - a virtual module, not a
 *  real path, so it's this plugin's resolveId that decides what it means. */
export const ENTRY_MODULE_ID = ENTRY_ID

/** Provides the virtual entry module used to discover and bundle the app's
 *  route files. The entry template contains the glob pattern, with appDir
 *  substituted at build time.
 *
 *  @param appDir App route directory relative to project root. */
export function entryPlugin(appDir: string): Plugin {
  return {
    name: 'pen:entry-app',
    resolveId: (id) => {
      if (id === ENTRY_ID)
        return RESOLVED_ENTRY_ID
    },
    load: (id) => {
      if (id !== RESOLVED_ENTRY_ID)
        return

      const templatePath = join(import.meta.dirname, 'templates/entry-app.tsx')
      const source = readFileSync(templatePath, 'utf-8')
      return source.replaceAll(APP_DIR_TOKEN, appDir)
    },
  }
}
