import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'
import { createSegmentTree } from '@/core/compiler'

// ===== Main Task =====

export const buildSegmentTree: Task<BuildContext> = {
  name: 'Building segment tree...',
  onSuccess: (_, dur) => `Built segment tree (${duration(dur)})`,
  run: async (ctx) => ({
    segmentTree: createSegmentTree(ctx.fileTree!),
  }),
}
