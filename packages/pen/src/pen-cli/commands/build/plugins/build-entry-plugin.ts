import type { Plugin } from 'vite'
import type { BuildPluginOptions } from './index'
import { PACKAGE_NAME } from '@/constants'
import { ENTRY_FILE } from '@/pen-cli/constants'
import { APP_DIR_TOKEN, INK_OPTIONS_TOKEN } from '@/pen-cli/entry-module'
import entryAppTemplate from './templates/entry-app.build.tsx.txt' with { type: 'text' }
import { substituteTemplate } from '@/lib/template'

const ENTRY_MODULE_ID = 'virtual:pen/entry-app.build.tsx'
const RESOLVED_ENTRY_MODULE_ID = `\0${ENTRY_MODULE_ID}`

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
    resolveId(id: string) {
      if (id === ENTRY_MODULE_ID)
        return RESOLVED_ENTRY_MODULE_ID
    },
    load(id) {
      if (id === RESOLVED_ENTRY_MODULE_ID)
        return substituteTemplate(entryAppTemplate, {
          [APP_DIR_TOKEN]: appDir,
          [INK_OPTIONS_TOKEN]: JSON.stringify(config.ink),
        })
    },
  }
}
