import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'
import { createSerializedComponentTreeMap } from '@/pen/compiler'

export const buildSerializedTree: Task<BuildContext> = {
  name: 'Building element trees',
  onSuccess: (_, dur) => `Built element trees (${duration(dur)})`,
  run: async (ctx) => ({
    serializedComponentTreeMap: createSerializedComponentTreeMap(ctx.manifest!, ctx.componentIndexMap!),
  }),
}
