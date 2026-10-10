import type { TransformResult } from 'oxc-transform-react'
import { transform } from 'oxc-transform-react'
import * as RefreshRuntime from 'react-refresh/runtime'
import refreshBoundarySource from './templates/refresh-boundary.ts.txt' with { type: 'text' }

export type TransformOptions = {
  reactCompiler?: boolean
  refresh?: boolean
}

const REFRESH_FILENAME_TOKEN = '"__PEN_REFRESH_FILENAME__"'
const REFRESH_CODE_TOKEN = '// __PEN_REFRESH_CODE__'

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

/** Wraps transformed code with the React Refresh runtime and adjusts its sourcemap for the added header. */
function createRefreshBoundary(transformed: TransformResult, filename: string) {
  const code = transformed.code
  transformed.code = refreshBoundarySource
    .replace(REFRESH_FILENAME_TOKEN, JSON.stringify(filename))
    .replace(REFRESH_CODE_TOKEN, code)

  if (transformed.map) {
    const headerLines = transformed.code.slice(0, transformed.code.indexOf(code)).split('\n').length - 1
    transformed.map.mappings = ';'.repeat(headerLines) + transformed.map.mappings
  }
  return transformed
}

/** Installs the React Refresh runtime globals that transformed modules read
 *  at evaluation time ($RefreshReg$, $RefreshSig$, RefreshRuntime). Call this
 *  once, before any transformed module is ever evaluated. */
export function installRefreshRuntime() {
  RefreshRuntime.injectIntoGlobalHook(globalThis as unknown as Window)  // react-refresh accepts Window, but it also works with globalThis
  globalThis.$RefreshReg$ = () => {}
  globalThis.$RefreshSig$ = (() => (type => type)) as typeof globalThis.$RefreshSig$  // temp until transformed module installs the real tracker
  globalThis.RefreshRuntime = createGlobalRefreshRuntime()
}

/** Transforms one Ink component file: optionally React Compiler, then JSX -
 *  with Fast Refresh instrumentation when `refresh` is on, production JSX
 *  otherwise. Throws on a fatal transform error. */
export async function transformInkComponent(filename: string, code: string, options?: TransformOptions): Promise<TransformResult> {
  const transformed = await transform(filename, code, {
    reactCompiler: options?.reactCompiler,
    jsx: {
      development: options?.refresh,
      refresh: options?.refresh,
    },
  })
  if (transformed.fatal)
    throw new Error(transformed.errors.map(e => e.message).join('\n'))
  return options?.refresh && transformed.code.includes('$RefreshReg$(')
    ? createRefreshBoundary(transformed, filename)
    : transformed
}
