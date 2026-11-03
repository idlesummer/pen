import type { Plugin } from 'vite'
import type { DevPluginOptions } from './types'
import { installRefreshRuntime, transformInkComponent } from './refresh'

/** Enables React Fast Refresh for Ink during development.
 *
 *  Also enables React Compiler when `config.reactCompiler` is set.
 *  Used for dev only, not used during builds. */
export function penRefresh({ config }: DevPluginOptions): Plugin {
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
          reactCompiler: config.reactCompiler,
          refresh: true,
        })
        if (transformed.fatal)
          this.error(transformed.errors.map(e => e.message).join('\n'))
        return transformed
      },
    },
  }
}
