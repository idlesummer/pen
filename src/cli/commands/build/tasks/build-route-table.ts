import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'
import { createRouteTable } from '@/pen/compiler'

// ===== Main Task =====

export const buildRouteTable: Task<BuildContext> = {
  name: 'Building route manifest',
  onSuccess: (_, dur) => `Built route table (${duration(dur)})`,
  run: async (ctx) => ({
    manifest: createRouteTable(ctx.segmentTree!, ctx.outDir),
  }),
}
