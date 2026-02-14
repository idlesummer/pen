import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'
import { createSerializedRoutes } from '@/pen/compiler'

export const buildSerializedRoutes: Task<BuildContext> = {
  name: 'Serializing routes',
  onSuccess: (_, dur) => `Serialized routes (${duration(dur)})`,
  run: async (ctx) => ({
    serializedRoutes: createSerializedRoutes(ctx.routeChainMap!, ctx.componentIdMap!),
  }),
}
