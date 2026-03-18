import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'
import { createRouteTree } from '@/pen/compiler'

export const buildRouteTree: Task<BuildContext> = {
  name: 'Building route tree',
  onSuccess: (_, dur) => `Built route tree (${duration(dur)})`,
  run: async (ctx) => ({
    routeTree: createRouteTree(ctx.segmentTree!, ctx.outDir),
  }),
}
