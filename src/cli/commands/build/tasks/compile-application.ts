import { join, resolve } from 'path'
import { build as rolldownBuild } from 'rolldown'
import nodeExternals from 'rollup-plugin-node-externals'
import { duration } from '@idlesummer/tasker'
import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'

export const compileApplication: Task<BuildContext> = {
  name: 'Compiling application',
  onSuccess: (_, dur) => `Compiled application (${duration(dur)})`,
  onError: (err) => `Compilation failed: ${err.message}`,
  run: async (ctx) => {
    await rolldownBuild({
      input: resolve(join(ctx.outDir, 'generated', 'entry.ts')),  // entry point
      platform: 'node',
      resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
      },
      plugins: [nodeExternals()],
      output: {
        dir: resolve(join(ctx.outDir, 'dist')),
        format: 'esm',
        sourcemap: true,
        minify: true,
      },
    })
  },
}
