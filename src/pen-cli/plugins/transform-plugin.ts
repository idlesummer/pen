import type { Plugin } from 'vite'
import type { PluginOptions } from './plugin-options'
import { transform } from 'oxc-transform-react'
import * as RefreshRuntime from 'react-refresh/runtime'
import refreshBoundarySource from '../refresh-ink/templates/refresh-boundary.ts.txt' with { type: 'text' }

const REFRESH_FILENAME_TOKEN = '"__PEN_REFRESH_FILENAME__"'
const REFRESH_CODE_TOKEN = '// __PEN_REFRESH_CODE__'

/** Wraps transformed code with the React Refresh runtime and adjusts its sourcemap for the added header. */
function createRefreshBoundary(transformed: Awaited<ReturnType<typeof transform>>, filename: string) {
  const code = transformed.code
  transformed.code = refreshBoundarySource
    .replace(REFRESH_FILENAME_TOKEN, JSON.stringify(filename))
    .replace(REFRESH_CODE_TOKEN, code)

  if (transformed.map) { // Shift OXC's mappings by the wrapper's added lines
    const headerLines = transformed.code.slice(0, transformed.code.indexOf(code)).split('\n').length - 1
    transformed.map.mappings = ';'.repeat(headerLines) + transformed.map.mappings
  }
  return transformed
}

/** Enables React Fast Refresh for Ink during development.
 *
 *  Also enables React Compiler when `options.reactCompiler` is set.
 *  Reads the option lazily because the config hook may not have run yet.
 *  Used for dev only, not used during builds. */
export function penTransform(options: PluginOptions): Plugin {
  return {
    name: 'pen:react-refresh-ink',
    enforce: 'pre',
    apply: 'serve',

    // Only runs this plugin's hooks for the SSR environment, not the client one
    applyToEnvironment(environment) {
      return environment.name === 'ssr'
    },
    // Transformed modules use these globals during evaluation, so the
    // globals must exist first. configureServer finishes before any import
    configureServer() {
      // @types/react-refresh only accepts Window, but the runtime works with globalThis
      RefreshRuntime.injectIntoGlobalHook(globalThis as unknown as Window)
      globalThis.$RefreshReg$ = () => {}

      // Temporary no-op until the transformed module installs the real tracker
      // Cast because it's not real logic, so it doesn't need the exact overloaded shape
      globalThis.$RefreshSig$ = (() => (type => type)) as typeof globalThis.$RefreshSig$

      // Plugin-specific helpers not provided by react-refresh/runtime
      globalThis.RefreshRuntime = {
        ...RefreshRuntime,
        getRefreshReg: (filename) => {
          return (type, id) => RefreshRuntime.register(type, `${filename} ${id}`)
        },
        // Checks whether a module can be refreshed in place
        validateRefreshBoundaryAndEnqueueUpdate: (prevExports, nextExports) => {
          const prevExportKeys = Object.keys(prevExports)
          const nextExportKeys = Object.keys(nextExports)

          if (prevExportKeys.some(key => !(key in nextExports)))  // Export removed: an importer may still use it
            return 'Could not Fast Refresh (export removed)'
          if (nextExportKeys.some(key => !(key in prevExports)))  // New export: importers need to see it
            return 'Could not Fast Refresh (new export)'

          const incompatibleExport = nextExportKeys.find(key =>
            !RefreshRuntime.isLikelyComponentType(nextExports[key]) &&
            prevExports[key] !== nextExports[key],
          )
          if (incompatibleExport) // Non-component exports must retain the same value
            return `Could not Fast Refresh ("${incompatibleExport}" export is incompatible)`

          RefreshRuntime.performReactRefresh()  // Re-render changed components with their new code, keeping hook state
        },
      }
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
        const transformed = await transform(filename, code, {
          reactCompiler: !!options.reactCompiler,
          jsx: {
            development: true, // jsxDEV + source locations; refresh needs it
            refresh: true,     // to emit $RefreshReg$/$RefreshSig$ calls inline
          },
        })
        if (transformed.fatal)
          this.error(transformed.errors.map(e => e.message).join('\n'))
        return transformed.code.includes('$RefreshReg$(')  // Skip modules without $RefreshReg$ so updates bubble to a real boundary
          ? createRefreshBoundary(transformed, filename)
          : transformed
      },
    },
  }
}
