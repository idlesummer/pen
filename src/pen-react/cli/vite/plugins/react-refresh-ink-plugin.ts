import type { Plugin } from 'vite'
import { transformWithOxc } from 'vite'
import * as RefreshRuntime from 'react-refresh/runtime'
import refreshBoundarySource from './templates/refresh-boundary.ts.txt' with { type: 'text' }

type OxcSourceMap = Awaited<ReturnType<typeof transformWithOxc>>['map']

// Filename is escaped for insertion into the template's string literal
const REFRESH_FILENAME_TOKEN = '__PEN_REFRESH_FILENAME__'
const REFRESH_CODE_TOKEN = '// __PEN_REFRESH_CODE__'

/** Wraps transformed code with the React Refresh runtime and adjusts its
 *  sourcemap for the added header. */
function createRefreshBoundary(code: string, oxcMap: OxcSourceMap, filename: string) {
  const escapedFilename = JSON.stringify(filename).slice(1, -1)
  const wrappedCode = refreshBoundarySource
    .replace(REFRESH_FILENAME_TOKEN, escapedFilename)
    .replace(REFRESH_CODE_TOKEN, code)

  // The wrapper only adds lines before the original code, so shift OXC's
  // mappings by the number of newlines before the code
  const headerLines = wrappedCode.slice(0, wrappedCode.indexOf(code)).split('\n').length - 1
  const map = oxcMap ? { ...oxcMap, mappings: ';'.repeat(headerLines) + oxcMap.mappings } : oxcMap
  return { code: wrappedCode, map }
}

/**
 * Installs React Fast Refresh for Ink: an OXC transform that instruments
 * component modules with $RefreshReg$/$RefreshSig$ calls, and a runtime
 * bootstrap (in configureServer) that those calls resolve to.
 *
 * Dev-only - Fast Refresh has no meaning during a one-shot `pen build`.
 */
export function penReactRefreshInk(): Plugin {
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

      // Temporary no-op until the transformed module installs the real tracker -
      // cast because it's a stub, not real logic, so it doesn't need the exact overloaded shape
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
            prevExports[key] === nextExports[key],
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
        const result = await transformWithOxc(code, filename, {
          jsx: {
            development: true, // jsxDEV + source locations; refresh needs it
            refresh: true,     // emit $RefreshReg$/$RefreshSig$ calls inline
          },
        })
        // No $RefreshReg$( call means no components - skip wrap so updates bubble to
        // a real boundary instead of being swallowed here. Map flows through.
        if (!result.code.includes('$RefreshReg$('))
          return { code: result.code, map: result.map }
        return createRefreshBoundary(result.code, result.map, filename)
      },
    },
  }
}
