import type { Plugin } from 'vite'
import entryAppSource from './templates/entry-app.tsx?raw'

/** Virtual module ID for the entry template. */
export const ENTRY_MODULE_ID = 'virtual:pen/entry-app.tsx'
const RESOLVED_ENTRY_MODULE_ID = `\0${ENTRY_MODULE_ID}`
const APP_DIR_TOKEN = '__PEN_APP_DIR__'

/**
 * Provides the virtual entry module used to discover and bundle the app's
 * route files. The entry template contains the glob pattern, with appDir
 * substituted at build time.
 *
 * entryAppSource is inlined at pen's own build time by tsdown.config.ts's
 * raw-import plugin - no file is read at runtime, and nothing ships in
 * dist/ beyond this module's own compiled output.
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

      return entryAppSource.replaceAll(APP_DIR_TOKEN, appDir)
    },
  }
}
