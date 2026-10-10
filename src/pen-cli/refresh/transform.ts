import type { TransformResult } from 'oxc-transform-react'
import { transform } from 'oxc-transform-react'
import refreshBoundarySource from './templates/refresh-boundary.ts.txt' with { type: 'text' }

export type TransformOptions = {
  reactCompiler?: boolean
  refresh?: boolean
}

const REFRESH_FILENAME_TOKEN = '"__PEN_REFRESH_FILENAME__"'
const REFRESH_CODE_TOKEN = '// __PEN_REFRESH_CODE__'

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
