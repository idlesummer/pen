import type { Plugin } from 'vite'
import type { BuildPluginOptions } from './types'
import { transform } from 'oxc-transform-react'

/** Runs React Compiler over app components during `pen build`. */
export function penReactCompiler({ config }: BuildPluginOptions): Plugin {
  return {
    name: 'pen:react-compiler',
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
        if (!config.reactCompiler) // let Rolldown's own default transform handle it
          return
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
