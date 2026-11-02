import type { Plugin, ViteDevServer } from 'vite'
import type { DevPluginOptions } from './index'
import { join } from 'node:path'
import { transform } from 'oxc-transform-react'
import { debounce } from '@/lib/debounce'
import { isPathInside } from '@/lib/path'
import { PEN_ROUTES_CHANGED_EVENT } from '@/pen-cli/constants'
import { ENTRY_MODULE_ID, resolveEntryModuleId, RESOLVED_ENTRY_MODULE_ID, substituteEntryTemplate } from '@/pen-cli/entry-module'
import * as log from '@/pen-cli/logger/console'
import entryAppTemplate from './templates/entry-app.dev.tsx.txt' with { type: 'text' }

/** Delay after the last file change before triggering a reload, in milliseconds. */
const DEBOUNCE_MS = 150

/** Loads the dev entry module and notifies it of route changes. */
export function penDevEntry({ appDir, startTime, config }: DevPluginOptions): Plugin {
  return {
    name: 'pen:dev-entry',
    perEnvironmentStartEndDuringDev: true,

    // Only runs this plugin's hooks for the SSR environment, not the client one
    applyToEnvironment(environment) {
      return environment.name === 'ssr'
    },
    resolveId: resolveEntryModuleId,
    async load(id: string) {
      if (id === RESOLVED_ENTRY_MODULE_ID) {
        const source = substituteEntryTemplate(entryAppTemplate, appDir, config.ink, true)

        const transformed = await transform(ENTRY_MODULE_ID, source, {
          jsx: { development: true },
          reactCompiler: false,  // since oxc-transform-react defaults to true
          sourcemap: true,  // transformWithOxc generates one by default
        })
        if (transformed.fatal)
          this.error(transformed.errors.map(e => e.message).join('\n'))
        return transformed
      }
    },
    // Starts the dev server
    configureServer(server: ViteDevServer) {
      const appDirAbsolute = join(server.config.root, appDir)
      const ssrEnvironment = server.environments.ssr! // guaranteed by applyToEnvironment
      const scheduleChange = debounce(() => ssrEnvironment.hot.send(PEN_ROUTES_CHANGED_EVENT), DEBOUNCE_MS)
      const onRouteFileChange = (filePath: string) => {
        if (filePath.endsWith('.tsx') && isPathInside(filePath, appDirAbsolute))
          scheduleChange()
      }
      server.watcher.on('add', onRouteFileChange)
      server.watcher.on('unlink', onRouteFileChange)
    },
    buildStart() {
      log.ready(`ready in ${Date.now() - startTime}ms`)
    },
  }
}
