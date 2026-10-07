import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

/**
 * Resolves the project's own locally installed `tsc` binary, so type
 * checking always runs against the user's own TypeScript version and
 * tsconfig - never a version pen itself depends on.
 *
 * @param projectDir - Project directory to resolve `typescript` from.
 * @returns Path to the resolved `tsc` script, or `undefined` if the
 * project has no `typescript` installed.
 */
export function resolveTsc(projectDir: string): string | undefined {
  try {
    const require = createRequire(join(projectDir, 'package.json'))
    const packageJsonPath = require.resolve('typescript/package.json')
    return join(dirname(packageJsonPath), 'bin', 'tsc')
  }
  catch {
    return undefined
  }
}
