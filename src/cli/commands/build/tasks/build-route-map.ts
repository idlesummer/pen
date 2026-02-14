import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'
import { createRouteMap } from '@/pen/compiler'

// ===== Main Task =====

export const buildRouteMap: Task<BuildContext> = {
  name: 'Building route manifest',
  onSuccess: (_, dur) => `Built route table (${duration(dur)})`,
  run: async (ctx) => ({
    manifest: createRouteMap(ctx.segmentTree!, ctx.outDir),
  }),
}
