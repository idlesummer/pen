import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'
import { createComponentMap } from '@/pen/compiler'

export const buildComponentMap: Task<BuildContext> = {
  name: 'Building component map',
  onSuccess: (_, dur) => `Built component map (${duration(dur)})`,
  run: async (ctx) => ({
    componentMap: createComponentMap(ctx.manifest!),
  }),
}
