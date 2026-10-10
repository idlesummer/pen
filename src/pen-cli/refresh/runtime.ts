import * as RefreshRuntime from 'react-refresh/runtime'

function createGlobalRefreshRuntime(): typeof globalThis.RefreshRuntime {
  return {
    ...RefreshRuntime,
    getRefreshReg: (filename) => ((type, id) => RefreshRuntime.register(type, `${filename} ${id}`)),
    validateRefreshBoundaryAndEnqueueUpdate: (prevExports, nextExports) => {
      const prevExportKeys = Object.keys(prevExports)
      const nextExportKeys = Object.keys(nextExports)

      if (prevExportKeys.some(key => !(key in nextExports)))
        return 'Could not Fast Refresh (export removed)'
      if (nextExportKeys.some(key => !(key in prevExports)))
        return 'Could not Fast Refresh (new export)'

      const incompatibleExport = nextExportKeys.find(key =>
        !RefreshRuntime.isLikelyComponentType(nextExports[key]) &&
        prevExports[key] !== nextExports[key],
      )
      if (incompatibleExport)
        return `Could not Fast Refresh ("${incompatibleExport}" export is incompatible)`
      RefreshRuntime.performReactRefresh()
    },
  }
}

/** Installs the React Refresh runtime globals that transformed modules read
 *  at evaluation time ($RefreshReg$, $RefreshSig$, RefreshRuntime).
 *
 *  Call before the React renderer (Ink) or any transformed module is loaded,
 *  e.g. from the dev plugin's `configureServer`. Later calls are no-ops. */
export function installRefreshRuntime() {
  if (globalThis.RefreshRuntime)  // already isntalled
  RefreshRuntime.injectIntoGlobalHook(globalThis as unknown as Window)  // react-refresh accepts Window, but it also works with globalThis
  globalThis.$RefreshReg$ = () => {}
  globalThis.$RefreshSig$ = (() => (type => type)) as typeof globalThis.$RefreshSig$  // temp until transformed module installs the real tracker
  globalThis.RefreshRuntime = createGlobalRefreshRuntime()
}
