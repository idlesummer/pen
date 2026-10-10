import type { TransformResult } from 'oxc-transform-react'
import { transform } from 'oxc-transform-react'
import refreshBoundarySource from './templates/refresh-boundary.ts.txt' with { type: 'text' }

/** Options for {@link transformInkComponent}. */
export type TransformOptions = {
  /** Runs React Compiler before the JSX transform. @default false */
  reactCompiler?: boolean
  /** Enables Fast Refresh; otherwise emits production JSX. @default false */
  refresh?: boolean
}

const REFRESH_FILENAME_TOKEN = '"__PEN_REFRESH_FILENAME__"'
const REFRESH_CODE_TOKEN = '// __PEN_REFRESH_CODE__'

/** Wraps transformed code with the React Refresh runtime and adjusts its sourcemap for the added header. */
function createRefreshBoundary(transformed: TransformResult, filename: string) {
  const code = transformed.code
  const filenameLiteral = JSON.stringify(filename)

  // Callbacks avoid `$` patterns (`$$`, `$&`) in the code being interpreted as replacement syntax
  transformed.code = refreshBoundarySource
    .replace(REFRESH_FILENAME_TOKEN, () => filenameLiteral)
    .replace(REFRESH_CODE_TOKEN, () => code)

  if (transformed.map) {
    const header = refreshBoundarySource.split(REFRESH_CODE_TOKEN)[0]!
    const headerLines = header.split('\n').length - 1
    transformed.map.mappings = ';'.repeat(headerLines) + transformed.map.mappings
  }
  return transformed
}

/** Transforms an Ink component file, with optional React Fast Refresh support.
 *
 *  Compiles JSX and optionally runs React Compiler. With `refresh` on, it emits
 *  Fast Refresh instrumentation and wraps modules that contain components in a
 *  refresh boundary. `installRefreshRuntime` must be called first. With
 *  `refresh` off, it emits production JSX.
 *
 *  @param filename - Path of the file, used for diagnostics, sourcemaps and refresh registration IDs.
 *  @param code - Source code of the component file.
 *  @param options - `reactCompiler` runs React Compiler; `refresh` enables Fast Refresh.
 *  @returns The transform result, with the sourcemap adjusted if the module was wrapped.
 *  @throws On a fatal transform error. */
export async function transformInkComponent(filename: string, code: string, options?: TransformOptions): Promise<TransformResult> {
  const transformed = await transform(filename, code, {
    reactCompiler: options?.reactCompiler ?? false, // react compiler is opt-in
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
