import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'
import { createComponentIndexMap } from '@/pen/compiler'

export const buildComponentIndexMap: Task<BuildContext> = {
  name: 'Building component map',
  onSuccess: (_, dur) => `Built component map (${duration(dur)})`,
  run: async (ctx) => ({
    componentIndexMap: createComponentIndexMap(ctx.manifest!),
  }),
}
