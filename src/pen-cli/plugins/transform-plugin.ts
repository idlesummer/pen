import type { Plugin } from 'vite'
import type { PluginOptions } from './types/plugin-options'
import { installRefreshRuntime, transformInkComponent } from '@/pen-cli/refresh'

/** Transforms component modules for dev and build.
 *
 *  Dev always enables Fast Refresh; build only transforms when React
 *  Compiler is enabled, preserving Rolldown's default behavior otherwise.
 *  Reads `options.reactCompiler` lazily because the config hook may not
 *  have run when this plugin is created. */
export function penTransform(options: PluginOptions): Plugin {
  return {
    name: 'pen:transform',
    enforce: 'pre',

    // Only runs this plugin's hooks for the SSR environment, not the client one
    applyToEnvironment(environment) {
      return environment.name === 'ssr'
    },
    // configureServer runs before imports in dev and isn't called during builds
    configureServer() {
      installRefreshRuntime() // Transformed modules need these globals before evaluation
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
        const isDev = this.environment.mode === 'dev'
        if (!isDev && !options.reactCompiler)
          return  // build, compiler off: let Rolldown's default transform handle it

        const filename = id.split('?')[0]!
        const transformed = await transformInkComponent(filename, code, {
          reactCompiler: !!options.reactCompiler,
          refresh: isDev,
        })
        if (transformed.fatal)
          this.error(transformed.errors.map(e => e.message).join('\n'))
        return transformed
      },
    },
  }
}
