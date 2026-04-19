import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'
import { createRolesMapping } from '@/pen/compiler'

export const createMapping: Task<BuildContext> = {
  name: 'Creating roles mapping',
  onSuccess: (ctx, dur) => `Mapped ${Object.keys(ctx.mapping!).length} role file(s) (${duration(dur)})`,
  run: async (ctx) => ({
    mapping: createRolesMapping(ctx.files!, ctx.appDir),
  }),
}
