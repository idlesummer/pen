import type { Plugin } from 'vite'
import type { RouteComponent, RouteModule } from '@/pen-react/runtime'
import { existsSync } from 'node:fs'
import { PACKAGE_NAME } from '@/lib/constants'
import { ssrGlob } from '@/lib/ssr-glob'
import { compileApp, formatDiagnostics, resolveDefaultExports } from '@/pen-core'
import { DefaultFallback, ErrorFallback } from '@/pen-react/runtime'
import entryAppSource from './templates/entry-app.tsx.txt' with { type: 'text' }
import { validateAsyncPages, validateComponentExports } from './validate'

export const BUILD_ENTRY = 'main.js'
export const ENTRY_MODULE_ID = 'virtual:pen/entry-app.tsx'
const RESOLVED_ENTRY_MODULE_ID = `\0${ENTRY_MODULE_ID}`
const APP_DIR_TOKEN = '__PEN_APP_DIR__'

/**
 * Compiles the app's routes into the virtual entry module Vite bundles, and
 * validates them during buildStart - before any transform work starts, so a
 * broken app never produces a bundle that would only fail once someone runs
 * it. Reports through Vite's own logger (this.warn/this.error) instead of a
 * separate print path, so there's a single source of truth for build output.
 *
 * Gated to the ssr environment: buildStart otherwise runs once per
 * environment Vite builds, and the client environment has no route modules
 * of its own to validate.
 *
 * @param appDir App route directory relative to project root.
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

      const moduleEntries = await ssrGlob<Partial<RouteModule>>(appDir)
      const components = resolveDefaultExports<RouteComponent>(moduleEntries, DefaultFallback, ErrorFallback)

      const filePaths = moduleEntries.map(entry => entry[0])
      const { modulePaths, pageEndpoints, diagnostics } = compileApp(filePaths)

      diagnostics.push(...validateComponentExports(modulePaths, components))
      diagnostics.push(...validateAsyncPages(pageEndpoints, components))

      const formatted = formatDiagnostics(diagnostics)
      for (const { severity, text } of formatted)
        if (severity === 'warn')
          this.warn(text)

      const errorText = formatted.filter(d => d.severity === 'error').map(d => d.text).join('\n\n')
      if (errorText)
        this.error(errorText)
    },
  }
}
