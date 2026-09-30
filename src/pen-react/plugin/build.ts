import type { Plugin } from 'vite'
import type { RouteComponent, RouteModule } from '@/pen-react/runtime'
import { existsSync } from 'node:fs'
import { PACKAGE_NAME } from '@/lib/constants'
import { ssrGlob } from '@/lib/ssr-glob'
import { createRouter, resolveDefaultExports } from '@/pen-core'
import { DefaultFallback, ErrorFallback } from '@/pen-react/runtime'
import entryAppSource from './templates/entry-app.tsx.txt' with { type: 'text' }
import { validateAsyncPages, validateComponentExports } from './validate'

export const BUILD_ENTRY = 'main.js'
export const ENTRY_MODULE_ID = 'virtual:pen/entry-app.tsx'
const RESOLVED_ENTRY_MODULE_ID = `\0${ENTRY_MODULE_ID}`
const APP_DIR_TOKEN = '__PEN_APP_DIR__'

/**
 * Loads the app's route modules, compiles their paths, and validates the
 * resulting routes before the build proceeds.
 *
 * Runs only in the SSR environment.
 *
 * @param appDir - App route directory relative to the project root.
 */
export function pen(appDir: string): Plugin {
  return {
    name: 'pen',

    applyToEnvironment(environment) {
      return environment.name === 'ssr'
    },
    config() {
      return {
        ssr: { noExternal: [PACKAGE_NAME] },  // Bundle pen's runtime instead of leaving it external
        build: {
          ssr: true,  // Build for Node so imports work instead of being treated as browser code
          rolldownOptions: {  // The entry-app template discovers the user's routes for bundling
            input: ENTRY_MODULE_ID,
            output: { entryFileNames: BUILD_ENTRY },
          },
        },
      }
    },
    resolveId(id) {
      if (id === ENTRY_MODULE_ID)
        return RESOLVED_ENTRY_MODULE_ID
    },
    load(id) {
      if (id === RESOLVED_ENTRY_MODULE_ID)
        return entryAppSource.replaceAll(APP_DIR_TOKEN, appDir)
    },
    async buildStart() {
      if (!existsSync(appDir))
        this.error(`No such directory: '${appDir}'`)

      // Maps paths to module objects as entries
      const moduleEntries = await ssrGlob<Partial<RouteModule>>(appDir)
      const routeComponents = resolveDefaultExports<RouteComponent>(moduleEntries, DefaultFallback, ErrorFallback)

      // createRouter compiles paths into route and position trees
      const filePaths = moduleEntries.map(entry => entry[0])
      const { modulePaths, pageEndpoints, diagnostics } = createRouter(filePaths)

      // Validates component exports and async pages
      diagnostics.push(...validateComponentExports(modulePaths, routeComponents))
      diagnostics.push(...validateAsyncPages(pageEndpoints, routeComponents))

      for (const { severity, text } of diagnostics)
        if (severity === 'warn')
          this.warn(text)

      const errorText = diagnostics.filter(d => d.severity === 'error').map(d => d.text).join('\n\n')
      if (errorText)
        this.error(errorText)
    },
  }
}
