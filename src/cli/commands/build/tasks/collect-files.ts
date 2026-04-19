import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'
import { collectAppFiles } from '@/pen/compiler'

export const collectFiles: Task<BuildContext> = {
  name: 'Collecting app files',
  onSuccess: (ctx, dur) => `Found ${ctx.files!.length} file(s) (${duration(dur)})`,
  run: async (ctx) => ({
    files: collectAppFiles(ctx.appDir),
  }),
}
