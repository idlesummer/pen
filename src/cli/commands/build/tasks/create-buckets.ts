import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'
import { createRoutesBuckets } from '@/pen/compiler'

export const createBuckets: Task<BuildContext> = {
  name: 'Creating route buckets',
  onSuccess: (ctx, dur) => `Bucketed ${Object.keys(ctx.buckets!).length} route(s) (${duration(dur)})`,
  run: async (ctx) => ({
    buckets: createRoutesBuckets(ctx.mapping!),
  }),
}
