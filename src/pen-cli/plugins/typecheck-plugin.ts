import type { Plugin } from 'vite'
import { spawn } from 'node:child_process'
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
function resolveTsc(projectDir: string): string | undefined {
  try {
    const require = createRequire(join(projectDir, 'package.json'))
    const packageJsonPath = require.resolve('typescript/package.json')
    return join(dirname(packageJsonPath), 'bin', 'tsc')
  }
  catch {
    return undefined
  }
}

/** Runs the project's own `tsc --noEmit` against its own tsconfig, so build
 *  errors come from the exact TypeScript version and config the editor
 *  already uses. Returns its diagnostic output on failure, or `undefined`
 *  if it passed or the project has no TypeScript installed. */
async function runTsc(projectDir: string): Promise<string | undefined> {
  const tscPath = resolveTsc(projectDir)
  if (!tscPath) return

  return new Promise(resolve => {
    const child = spawn(process.execPath, [tscPath, '--noEmit', '--pretty'], { cwd: projectDir })

    let output = ''

    child.stdout.on('data', chunk => output += chunk)
    child.stderr.on('data', chunk => output += chunk)
    child.on('close', code => resolve(code === 0 ? undefined : output))
  })
}

/**
 * Type-checks the project before the real build starts.
 *
 * Runs only in the SSR environment. Marked `sequential` so a future
 * buildStart hook on another plugin can never silently race this one -
 * Vite dispatches buildStart in parallel across plugins by default.
 */
export function penTypecheck(): Plugin {
  return {
    name: 'pen:typecheck',

    applyToEnvironment(environment) {
      return environment.name === 'ssr'
    },
    buildStart: {
      sequential: true,

      async handler() {
        const projectDir = this.environment.config.root
        const typeErrors = await runTsc(projectDir)
        if (typeErrors) this.error(typeErrors)
      },
    },
  }
}
