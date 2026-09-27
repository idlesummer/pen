import type { Plugin } from 'vite'
import type { RouteComponent, RouteModule } from '@/pen-react/runtime'
import { createServer } from 'vite'
import { PACKAGE_NAME } from '@/lib/constants'
import { findFiles } from '@/lib/find-files'
import { compileApp, formatDiagnostics, GLOBAL_DEFAULT, GLOBAL_ERROR } from '@/pen-core'
import { DefaultFallback, ErrorFallback } from '@/pen-react/runtime'
import entryAppSource from './templates/entry-app.tsx.txt' with { type: 'text' }
import { validateAsyncPages, validateComponentExports } from './validate'

export const BUILD_ENTRY = 'main.js'
export const ENTRY_MODULE_ID = 'virtual:pen/entry-app.tsx'
const RESOLVED_ENTRY_MODULE_ID = `\0${ENTRY_MODULE_ID}`
const APP_DIR_TOKEN = '__PEN_APP_DIR__'

/** Imports every route module for real through Vite's transform pipeline.
 *  Needs its own server even inside a build environment's buildStart - a
 *  build environment has no ssrLoadModule equivalent, only a dev server
 *  does, so there's no way to get real executed exports otherwise. */
async function loadComponents(appDir: string, filePaths: string[]): Promise<Map<string, RouteComponent | undefined>> {
  // Silent: a transform error here still throws and reaches buildStart's
  // own this.error, which reports it through the same channel as every
  // other diagnostic - Vite's own dev-server logger would otherwise print
  // it a second time, ahead of and separately from that diagnostic.
  const server = await createServer({ configFile: false, logLevel: 'silent', server: { middlewareMode: true } })
  try {
    const components = new Map<string, RouteComponent | undefined>()
    for (const filePath of filePaths) {
      const module = await server.ssrLoadModule(`/${appDir}/${filePath}`) as Partial<RouteModule>
      components.set(filePath, module.default)
    }
    components.set(GLOBAL_DEFAULT, DefaultFallback)
    components.set(GLOBAL_ERROR, ErrorFallback)
    return components
  }
  finally {
    await server.close()
  }
}

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
    applyToEnvironment: environment => environment.name === 'ssr',
    config: () => ({
      ssr: { // Bundle pen's runtime instead of leaving it external
        noExternal: [PACKAGE_NAME],
      },
      build: {
        // Build for Node so imports work instead of being treated as browser code
        ssr: true,
        rolldownOptions: {
          // The entry-app template discovers the user's routes for bundling
          input: ENTRY_MODULE_ID,
          output: { entryFileNames: BUILD_ENTRY },
        },
      },
    }),
    resolveId: (id) => {
      if (id === ENTRY_MODULE_ID)
        return RESOLVED_ENTRY_MODULE_ID
    },
    load: (id) => {
      if (id === RESOLVED_ENTRY_MODULE_ID)
        return entryAppSource.replaceAll(APP_DIR_TOKEN, appDir)
    },

    async buildStart() {
      const filePaths = findFiles(appDir, '.tsx')
      const components = await loadComponents(appDir, filePaths)
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
