import type { Plugin } from 'vite'
import type { PluginOptions } from './types/plugin-options'
import { transform } from 'oxc-transform-react'

/** Runs React Compiler over the app's component modules during `pen build`,
 *  when `options.reactCompiler` is enabled.
 *
 *  Only intercepts a `.tsx` file once the compiler is actually on - with it
 *  off, the handler returns nothing so Rolldown's own default JSX/TS
 *  transform handles the file exactly as before, leaving the (default,
 *  compiler-off) build path unaffected.
 *
 *  No Fast Refresh here - that's a dev-only concept, see refresh-plugin.ts. */
export function penReactCompilerBuild(options: PluginOptions): Plugin {
  return {
    name: 'pen:react-compiler-build',
    enforce: 'pre',

    // Only runs this plugin's hooks for the SSR environment, not the client one
    applyToEnvironment(environment) {
      return environment.name === 'ssr'
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
        if (!options.reactCompiler)
          return  // let Rolldown's own default transform handle it

        const filename = id.split('?')[0]!
        const transformed = await transform(filename, code, {
          reactCompiler: true,
          jsx: { development: false },  // production JSX runtime - no jsxDEV, no source locations
        })
        if (transformed.fatal)
          this.error(transformed.errors.map(e => e.message).join('\n'))

        return transformed
      },
    },
  }
}
