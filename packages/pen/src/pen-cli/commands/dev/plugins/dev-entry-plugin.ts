import type { Plugin, ViteDevServer } from 'vite'
import type { DevPluginOptions } from './index'
import { join } from 'node:path'
import { transform } from 'oxc-transform-react'
import { debounce } from '@/lib/debounce'
import { isPathInside } from '@/lib/path'
import { PEN_ROUTES_CHANGED_EVENT } from '@/pen-cli/constants'
import { APP_DIR_TOKEN, INK_OPTIONS_TOKEN } from '@/pen-cli/entry-module'
import * as log from '@/pen-cli/logger/console'
import entryAppTemplate from './templates/entry-app.dev.tsx.txt' with { type: 'text' }
import { stripRegion, substituteTemplate } from '@/lib/template'

export const ENTRY_MODULE_ID = 'virtual:pen/entry-app.dev.tsx'
const RESOLVED_ENTRY_MODULE_ID = `\0${ENTRY_MODULE_ID}`

function isAppRouteFile(filePath: string, appDirAbsolute: string) {
  return filePath.endsWith('.tsx') && isPathInside(filePath, appDirAbsolute)
}

/** Loads the dev entry module and notifies it of route changes. */
export function penDevEntry({ appDir, startTime, config }: DevPluginOptions): Plugin {
  return {
    name: 'pen:dev-entry',
    perEnvironmentStartEndDuringDev: true,

    // Only runs this plugin's hooks for the SSR environment, not the client one
    applyToEnvironment(environment) {
      return environment.name === 'ssr'
    },
    resolveId(id: string) {
      if (id === ENTRY_MODULE_ID)
        return RESOLVED_ENTRY_MODULE_ID
    },
    async load(id: string) {
      if (id === RESOLVED_ENTRY_MODULE_ID) {
        const source = substituteTemplate(stripRegion(entryAppTemplate, 'codegen'), {
          [APP_DIR_TOKEN]: JSON.stringify(appDir),
          [INK_OPTIONS_TOKEN]: JSON.stringify(config.ink),
        })
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
      const scheduleChange = debounce(() => ssrEnvironment.hot.send(PEN_ROUTES_CHANGED_EVENT), 150)  // waits 150ms before reloading routes
      const onRouteFileChange = (event: 'add' | 'unlink', filePath: string) => {
        if (!isAppRouteFile(filePath, appDirAbsolute)) return
        server.config.logger.info(`file ${event} ${filePath}`)
        scheduleChange()
      }
      server.watcher.on('add', path => onRouteFileChange('add', path))
      server.watcher.on('unlink', path => onRouteFileChange('unlink', path))
    },
    // A deleted route file is already fully handled above via
    // PEN_ROUTES_CHANGED_EVENT - this only stops Vite's own default HMR
    // propagation from separately trying (and failing) to reload a file
    // that's gone, which otherwise prints a misleading "failed to reload,
    // could be a syntax error" message for a plain, expected deletion.
    // handleHotUpdate (legacy) only runs for type: 'update', never for
    // create/delete - hotUpdate is the one Vite actually calls for those.
    hotUpdate(options) {
      const appDirAbsolute = join(options.server.config.root, appDir)
      if (options.type === 'delete' && isAppRouteFile(options.file, appDirAbsolute))
        return []
    },
    buildStart() {
      log.ready(`ready in ${Date.now() - startTime}ms`)
    },
  }
}
