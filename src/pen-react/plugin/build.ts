import type { Plugin } from 'vite'
import type { RouteComponent, RouteModule } from '@/pen-react/runtime'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { PACKAGE_NAME } from '@/lib/constants'
import { ssrGlob } from '@/lib/ssr-glob'
import { createDefaultExportMap, createRouter, GLOBAL_DEFAULT, GLOBAL_ERROR } from '@/pen-core'
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
      // existsSync/ssrGlob are plain Node fs calls - Vite's own root option
      // doesn't reach them, so root is read explicitly and joined by hand
      const root = this.environment.config.root
      if (!existsSync(join(root, appDir)))
        this.error(`No such directory: '${appDir}'`)

      // Maps paths to module objects as entries
      const moduleEntries = await ssrGlob<Partial<RouteModule>>(appDir, root)
      const routeComponents = createDefaultExportMap<RouteComponent>(moduleEntries)
      routeComponents[GLOBAL_DEFAULT] = DefaultFallback
      routeComponents[GLOBAL_ERROR] = ErrorFallback

      // createRouter compiles paths into route and position trees
      const filePaths = moduleEntries.map(entry => entry[0])
      const { modulePaths, pageEndpoints, diagnostics } = createRouter(filePaths)

      // Validates component exports and async pages
      diagnostics.push(...validateComponentExports(modulePaths, routeComponents))
      diagnostics.push(...validateAsyncPages(pageEndpoints, routeComponents))

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
