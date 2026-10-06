import type { Plugin } from 'vite'
import { relative } from 'node:path'
import { transformWithOxc } from 'vite'
import * as RefreshRuntime from 'react-refresh/runtime'
import * as log from '@/pen-cli/log'
import refreshBoundarySource from './templates/refresh-boundary.ts.txt' with { type: 'text' }

const REFRESH_FILENAME_TOKEN = '"__PEN_REFRESH_FILENAME__"'
const REFRESH_CODE_TOKEN = '// __PEN_REFRESH_CODE__'

/** Wraps transformed code with the React Refresh runtime and adjusts its sourcemap for the added header. */
function createRefreshBoundary(transformed: Awaited<ReturnType<typeof transformWithOxc>>, filename: string) {
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

/** Installs React Fast Refresh for Ink: an OXC transform that instruments
 *  component modules with $RefreshReg$/$RefreshSig$ calls, and a runtime
 *  bootstrap (in configureServer) that those calls resolve to.
 *
 *  Dev-only - Fast Refresh has no meaning during a one-shot `pen build`. */
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
    configureServer(server) {
      // Set by the watcher below, read and cleared once the matching
      // refresh finishes - there's only ever one edit in flight at a time.
      let pending: { file: string, start: number } | undefined

      // handleHotUpdate isn't called in this headless/middlewareMode setup
      // (confirmed empirically), so the raw chokidar watcher is the only
      // reliable signal that a file changed.
      server.watcher.on('change', (file) => {
        if (!file.endsWith('.tsx')) return
        pending = { file, start: Date.now() }
        log.wait(`Compiling ${relative(server.config.root, file)}...`)
      })

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

          const fail = (message: string) => {
            if (pending) log.warn(`${message} - reloading ${relative(server.config.root, pending.file)}`)
            pending = undefined
            return message
          }

          if (prevExportKeys.some(key => !(key in nextExports)))  // Export removed: an importer may still use it
            return fail('Could not Fast Refresh (export removed)')
          if (nextExportKeys.some(key => !(key in prevExports)))  // New export: importers need to see it
            return fail('Could not Fast Refresh (new export)')

          const incompatibleExport = nextExportKeys.find(key =>
            !RefreshRuntime.isLikelyComponentType(nextExports[key]) &&
            prevExports[key] !== nextExports[key],
          )
          if (incompatibleExport) // Non-component exports must retain the same value
            return fail(`Could not Fast Refresh ("${incompatibleExport}" export is incompatible)`)

          RefreshRuntime.performReactRefresh()  // Re-render changed components with their new code, keeping hook state
          if (pending) {
            log.event(`Compiled ${relative(server.config.root, pending.file)} in ${Date.now() - pending.start}ms`)
            pending = undefined
          }
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
        const transformed = await transformWithOxc(code, filename, {
          jsx: {
            development: true, // jsxDEV + source locations; refresh needs it
            refresh: true,     // to emit $RefreshReg$/$RefreshSig$ calls inline
          },
        })
        return transformed.code.includes('$RefreshReg$(')  // Skip modules without $RefreshReg$ so updates bubble to a real boundary
          ? createRefreshBoundary(transformed, filename)
          : transformed
      },
    },
  }
}
