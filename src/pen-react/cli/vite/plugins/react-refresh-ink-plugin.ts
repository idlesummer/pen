import type { Plugin } from 'vite'
import { transformWithOxc } from 'vite'
import * as RefreshRuntime from 'react-refresh/runtime'
import type { AnyFn } from 'react-refresh/runtime'
import refreshBoundarySource from './templates/refresh-boundary.ts.txt' with { type: 'text' }

type OxcSourceMap = Awaited<ReturnType<typeof transformWithOxc>>['map']

// Filename is escaped for insertion into the template's string literal
const REFRESH_FILENAME_TOKEN = '__PEN_REFRESH_FILENAME__'
const REFRESH_CODE_TOKEN = '// __PEN_REFRESH_CODE__'

// Installed before any module's own header runs, and restored after every
// one (see __prev_Sig__ in refresh-boundary.ts.txt) - the steady-state value
// between refresh boundaries, not a one-off throwaway, so it carries the
// exact overloaded shape createSignatureFunctionForTransform's real return
// type requires, rather than casting past a mismatched single-signature
// arrow function: callable with zero args (collects custom hooks - no-op
// here, nothing is tracking signatures outside a transformed module), or
// with a type to tag (returns it unchanged).
function noopRefreshSig(): void
function noopRefreshSig<T>(type: T, key: string, forceReset?: boolean, getCustomHooks?: () => AnyFn[]): T
function noopRefreshSig<T>(type?: T): T | void {
  return type
}

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

      // Temporary no-op until the transformed module installs the real tracker
      globalThis.$RefreshSig$ = () => noopRefreshSig

      // Plugin-specific helpers not provided by react-refresh/runtime
      globalThis.RefreshRuntime = {
        ...RefreshRuntime,

        getRefreshReg: (filename: string) => {
          return (type, id) => RefreshRuntime.register(type, `${filename} ${id}`)
        },
        // Checks whether a module can be refreshed in place
        validateRefreshBoundaryAndEnqueueUpdate: (prevExports, nextExports) => {

          // Export removed: an importer may still use it
          if (Object.keys(prevExports).some(key => !(key in nextExports)))
            return 'Could not Fast Refresh (export removed)'

          // New export: importers need to see it
          if (Object.keys(nextExports).some(key => !(key in prevExports)))
            return 'Could not Fast Refresh (new export)'

          // Non-component exports must retain the same value
          const incompatibleExport = Object.keys(nextExports).find(key => {
            const isComponent = RefreshRuntime.isLikelyComponentType(nextExports[key])
            const isUnchanged = prevExports[key] === nextExports[key]
            return !isComponent && !isUnchanged
          })
          if (incompatibleExport)
            return `Could not Fast Refresh ("${incompatibleExport}" export is incompatible)`

          // Safe: re-render the changed components with their new code, keeping hook state.
          RefreshRuntime.performReactRefresh()
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
