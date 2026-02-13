import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'
import { buildComponentMap } from '@/core/compiler'

export const buildComponentMapTask: Task<BuildContext> = {
  name: 'Building component map',
  onSuccess: (_, dur) => `Built component map (${duration(dur)})`,
  run: async (ctx) => ({
    componentMap: buildComponentMap(ctx.manifest!),
  }),
}
