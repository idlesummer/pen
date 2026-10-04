import type { Plugin } from 'vite'
import { transformWithOxc } from 'vite'
import * as RefreshRuntime from 'react-refresh/runtime'

/** Globals installed by the plugin's dev server. */
declare global {
  var $RefreshReg$: undefined |
    ((type: unknown, id: string) => void)

  var $RefreshSig$: undefined |
    (() => ReturnType<typeof import('react-refresh/runtime').createSignatureFunctionForTransform>)

  var RefreshRuntime: undefined |
    (typeof import('react-refresh/runtime') & {
      getRefreshReg: (filename: string) => (type: unknown, id: string) => void
      validateRefreshBoundaryAndEnqueueUpdate: (prevExports: Record<string, unknown>, nextExports: Record<string, unknown>) =>
        string | undefined
    })
}

type TransformResult = Awaited<ReturnType<typeof transformWithOxc>>

// Save/restore of the globals is safe only because dev.js does ONE
// runner.import() - Vite evaluates modules one at a time, so nothing else
// touches $RefreshReg$ mid-module. Concurrent imports would break that.
//
// Header must be PREPENDED so the $RefreshSig$ assignment lands above OXC's
// `var _s = $RefreshSig$()`, else _s captures the no-op and signatures break.
//
// Sourcemap: the header is a whole-line insertion above the code and the
// footer sits below it, so the only change to OXC's map is shifting every
// generated line down by the header's line count - i.e. one ';' (the mappings
// line separator) per header line. The header MUST end exactly on a newline
// (no trailing spaces), else line-1 columns shift too. If the wrap ever edits
// the middle of the code, this shortcut breaks: use magic-string + remapping.
function createRefreshBoundary({ code, map: oxcMap }: TransformResult, filename: string) {
  const header = `
    const __prev_Reg__ = globalThis.$RefreshReg$
    const __prev_Sig__ = globalThis.$RefreshSig$
    globalThis.$RefreshReg$ = globalThis.RefreshRuntime.getRefreshReg(${JSON.stringify(filename)})
    globalThis.$RefreshSig$ = globalThis.RefreshRuntime.createSignatureFunctionForTransform\n`

  // Footer: import this module's own current exports, then self-accept and let the runtime
  // compare them with the incoming ones; if it isn't a clean refresh boundary, invalidate
  // so the update bubbles to importers. (The official plugin does the self-import through
  // RefreshRuntime.__hmr_import; here it must be in the module so Vite's runner handles it.)
  const footer = `
    globalThis.$RefreshReg$ = __prev_Reg__
    globalThis.$RefreshSig$ = __prev_Sig__
    if (import.meta.hot) {
      import(/* @vite-ignore */ import.meta.url).then((currentExports) => {
        import.meta.hot.accept((nextExports) => {
          if (!nextExports) return
          const invalidateMessage = globalThis.RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate(currentExports, nextExports)
          if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage)
        })
      })
    }`

  const headerLines = header.split('\n').length - 1
  const map = oxcMap ? { ...oxcMap, mappings: ';'.repeat(headerLines) + oxcMap.mappings } : oxcMap
  return { code: `${header}${code}${footer}`, map }
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

    // Transformed modules call $RefreshReg$/$RefreshSig$ during evaluation, so
    // the globals must exist first. configureServer finishes before any import.
    configureServer() {
      // @types/react-refresh types this as browser-only (Window), but the
      // function itself just looks for/creates __REACT_DEVTOOLS_GLOBAL_HOOK__
      // on whatever object it's given - Node's globalThis works the same way.
      RefreshRuntime.injectIntoGlobalHook(globalThis as unknown as Window)
      globalThis.$RefreshReg$ = () => {}
      // Placeholder until a module's header (see createRefreshBoundary) installs
      // the real signature tracker - never called with 0 args itself, so the
      // official dual-overload type (0-arg or 4-arg) doesn't fit; cast past it.
      globalThis.$RefreshSig$ = (() => (type: unknown) => type) as typeof globalThis.$RefreshSig$

      // getRefreshReg and validateRefreshBoundaryAndEnqueueUpdate aren't in
      // react-refresh/runtime - this plugin adds them to its own copy of the
      // runtime, same as the official plugin does.
      globalThis.RefreshRuntime = {
        ...RefreshRuntime,

        getRefreshReg: (filename: string) => {
          return (type: unknown, id: string) => RefreshRuntime.register(type, `${filename} ${id}`)
        },

        // Decides whether a re-run module can be refreshed in place or must pass the update
        // up to its importers. Called from each module's footer (see createRefreshBoundary):
        //   prevExports exports of the version that was running
        //   nextExports exports of the version that just loaded
        // Returns a message when the module can't be refreshed in place (the footer then calls
        // import.meta.hot.invalidate(message), so Vite re-runs the importers); returns nothing
        // after refreshing. A port of the official check, minus its ignore-list hook, compound
        // components and debounce (the official one queues the refresh; this one runs it now).
        validateRefreshBoundaryAndEnqueueUpdate: (prevExports: Record<string, unknown>, nextExports: Record<string, unknown>) => {
          // 1. An export disappeared: an importer may still use it.
          if (Object.keys(prevExports).some(key => !(key in nextExports)))
            return 'Could not Fast Refresh (export removed)'

          // 2. An export appeared: importers need to see it.
          if (Object.keys(nextExports).some(key => !(key in prevExports)))
            return 'Could not Fast Refresh (new export)'

          // 3. Every export must be a component, or a non-component whose value is unchanged
          //    (e.g. `export const label = 'v1'`). Compared with !==, so a changed value, or a
          //    new object/array/function (each run creates one), counts as changed.
          const incompatible = Object.keys(nextExports).find(key =>
            !RefreshRuntime.isLikelyComponentType(nextExports[key]) && prevExports[key] !== nextExports[key])
          if (incompatible)
            return `Could not Fast Refresh ("${incompatible}" export is incompatible)`

          // 4. Safe: re-render the changed components with their new code, keeping hook state.
          //    The new versions were already registered by this run's $RefreshReg$ calls.
          RefreshRuntime.performReactRefresh()
        },
      }
    },

    // The id filter is a dumb regex match with no virtual-module awareness
    // (unlike @rollup/pluginutils's createFilter, it doesn't skip \0-prefixed
    // ids on its own) - RESOLVED_ENTRY_MODULE_ID also ends in .tsx, so it has
    // to be excluded explicitly, or dev-plugin.ts's already-transformed entry
    // module would get reprocessed here.
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
        return createRefreshBoundary(result, filename)
      },
    },
  }
}
