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

/** Serves the entry-app template as a virtual module instead of pointing
 *  the build directly at a shipped file. The template's own glob pattern
 *  has to stay a literal string for Vite's static analysis, so it ships
 *  with a placeholder token and this plugin substitutes the real appDir
 *  in per build, rather than the pattern being frozen at pen's own
 *  publish time regardless of what appDir a caller actually passes. */
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
