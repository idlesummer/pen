import type { Plugin } from 'vite'
import type { PluginOptions } from './types/plugin-options'
import { installRefreshRuntime, transformInkComponent } from '@/pen-cli/refresh'

/** Enables React Fast Refresh for Ink during development.
 *
 *  Also enables React Compiler when `options.reactCompiler` is set.
 *  Reads the option lazily because the config hook may not have run yet.
 *  Used for dev only, not used during builds. */
export function penRefresh(options: PluginOptions): Plugin {
  return {
    name: 'pen:refresh',
    enforce: 'pre',
    apply: 'serve',

    // Only runs this plugin's hooks for the SSR environment, not the client one
    applyToEnvironment(environment) {
      return environment.name === 'ssr'
    },
    // Transformed modules use these globals during evaluation, so the
    // globals must exist first. configureServer finishes before any import
    configureServer() {
      installRefreshRuntime()
    },
    // Exclude virtual modules since the .tsx filter would otherwise match them
    transform: {
      filter: {
        id: {
          include: /\.tsx(\?|$)/,
          exclude: [/node_modules/, /^\0/],
        },
      },
      async handler(code, id) {
        const filename = id.split('?')[0]!
        const transformed = await transformInkComponent(filename, code, {
          reactCompiler: options.reactCompiler ?? false,
          refresh: true,
        })
        if (transformed.fatal)
          this.error(transformed.errors.map(e => e.message).join('\n'))
        return transformed
      },
    },
  }
}
