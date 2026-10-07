import type { Plugin } from 'vite'
import { spawn } from 'node:child_process'
import { resolveTsc } from '@/lib/resolve-tsc'
import * as log from '@/pen-cli/logger/console'

/** Runs the project's own `tsc --noEmit` against its own tsconfig, so build
 *  errors come from the exact TypeScript version and config the editor
 *  already uses. Returns its diagnostic output on failure, or `undefined`
 *  if it passed or the project has no TypeScript installed. */
function runTsc(projectDir: string): Promise<string | undefined> {
  const tscPath = resolveTsc(projectDir)
  if (!tscPath) return Promise.resolve(undefined)

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [tscPath, '--noEmit', '--pretty'], { cwd: projectDir })
    let output = ''
    child.stdout.on('data', (chunk: Buffer) => output += chunk)
    child.stderr.on('data', (chunk: Buffer) => output += chunk)
    child.on('close', code => resolve(code === 0 ? undefined : output))
  })
}

/**
 * Type-checks the project before the real build starts.
 *
 * Exits directly on failure instead of going through `this.error()`,
 * which would otherwise wrap the message in rolldown's own stack trace.
 *
 * Runs only in the SSR environment. Marked `sequential` so a future
 * buildStart hook on another plugin can never silently race this one -
 * Vite dispatches buildStart in parallel across plugins by default.
 */
export function penTypecheck(): Plugin {
  return {
    name: 'pen:build-typecheck',

    applyToEnvironment(environment) {
      return environment.name === 'ssr'
    },
    buildStart: {
      sequential: true,
      async handler() {
        const typeErrors = await runTsc(this.environment.config.root)
        if (typeErrors) {
          log.error(typeErrors)
          process.exit(1)
        }
      },
    },
  }
}
