import { join, resolve } from 'path'
import { build as rolldownBuild } from 'rolldown'
import nodeExternals from 'rollup-plugin-node-externals'

import { duration, type Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'

export const compileTask: Task<BuildContext> = {
  name: 'Compiling application',
  onSuccess: (_, dur) => `Compiled application (${duration(dur)})`,
  onError: (err) => `Compilation failed: ${err.message}`,
  run: async (ctx) => {
    const entryPoint = resolve(join(ctx.outDir, 'generated', 'entry.ts'))

    await rolldownBuild({
      input: entryPoint,
      platform: 'node',
      resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
      },
      plugins: [nodeExternals()],
      output: {
        dir: resolve(join(ctx.outDir, 'dist')),  // Also resolve output
        format: 'esm',
        sourcemap: true,
        minify: true,
      },
    })
  },
}
