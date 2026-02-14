import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'
import { createComponentIdMap } from '@/pen/compiler'

export const buildComponentIdMap: Task<BuildContext> = {
  name: 'Building component index map',
  onSuccess: (_, dur) => `Built component map (${duration(dur)})`,
  run: async (ctx) => ({
    componentIdMap: createComponentIdMap(ctx.routeChainMap!),
  }),
}
