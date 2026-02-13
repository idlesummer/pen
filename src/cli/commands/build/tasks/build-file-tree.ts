import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'
import { createFileTree } from '@/core/compiler'

// ===== Main Task =====

export const buildFileTree: Task<BuildContext> = {
  name: 'Building file tree',
  onSuccess: (_, dur) => `Built file tree (${duration(dur)})`,
  run: async (ctx) => ({
    fileTree: createFileTree(ctx.appDir),
  }),
}
