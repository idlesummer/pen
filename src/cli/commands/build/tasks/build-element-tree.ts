import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'
import { createElementTrees } from '@/core/route-builder'

export const buildElementTree: Task<BuildContext> = {
  name: 'Building element trees',
  onSuccess: (_, dur) => `Built element trees (${duration(dur)})`,
  run: async (ctx) => ({
    elementTrees: createElementTrees(ctx.manifest!),
  }),
}
