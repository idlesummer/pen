import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'
import { createRouteChainMap } from '@/pen/compiler'

// ===== Main Task =====

export const buildRouteChainMap: Task<BuildContext> = {
  name: 'Building route chain map',
  onSuccess: (_, dur) => `Built route chain map (${duration(dur)})`,
  run: async (ctx) => ({
    routeChainMap: createRouteChainMap(ctx.segmentTree!, ctx.outDir),
  }),
}
