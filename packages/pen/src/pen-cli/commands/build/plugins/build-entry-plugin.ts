import type { Plugin } from 'vite'
import type { BuildPluginOptions } from './index'
import { PACKAGE_NAME } from '@/constants'
import { ENTRY_FILE } from '@/pen-cli/constants'
import { ENTRY_MODULE_ID, resolveEntryModuleId, RESOLVED_ENTRY_MODULE_ID, substituteEntryTemplate } from '@/pen-cli/entry-module'
import entryAppTemplate from './templates/entry-app.build.tsx.txt' with { type: 'text' }

/** Bundles the app's entry module for Node. */
export function penBuildEntry({ appDir, config }: BuildPluginOptions): Plugin {
  return {
    name: 'pen:build-entry',

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
    resolveId: resolveEntryModuleId,
    load(id) {
      if (id === RESOLVED_ENTRY_MODULE_ID)
        return substituteEntryTemplate(entryAppTemplate, appDir, config.ink, false)
    },
  }
}
