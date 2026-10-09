import type { Plugin } from 'vite'
import { PACKAGE_NAME } from '@/lib/constants'
import { APP_DIR_TOKEN, ENTRY_FILE, ENTRY_MODULE_ID, INK_OPTIONS_TOKEN, RESOLVED_ENTRY_MODULE_ID } from '@/pen-cli/constants'
import entryAppSource from './templates/entry-app.tsx.txt' with { type: 'text' }
import type { PluginOptions } from './plugin-options'

/** Bundles the app's entry module for Node.
 *
 *  Runs only in the SSR environment. `ink` is read lazily off `options`
 *  inside `load()` rather than destructured here, since pen:config's
 *  `config` hook (which populates it) hasn't necessarily run yet at the
 *  time this factory itself is called. */
export function penBuild(options: PluginOptions): Plugin {
  const { routesDir } = options
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
        return entryAppSource
          .replaceAll(APP_DIR_TOKEN, routesDir)
          .replaceAll(INK_OPTIONS_TOKEN, JSON.stringify(options.ink ?? {}))
    },
  }
}
