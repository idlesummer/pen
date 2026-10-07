import { spawn } from 'node:child_process'
import { resolveTsc } from '@/lib/resolve-tsc'

/**
 * Runs the project's own `tsc --noEmit` against its own tsconfig, so build
 * errors come from the exact TypeScript version and config the editor
 * already uses.
 *
 * @param projectDir - Project directory to type-check.
 * @returns tsc's own diagnostic output if type checking failed, or
 * `undefined` if it passed or the project has no TypeScript installed.
 */
export function typeCheck(projectDir: string): Promise<string | undefined> {
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
