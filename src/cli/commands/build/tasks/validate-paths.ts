import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'
import { validateAppPaths } from '@/pen/compiler'

export const validatePaths: Task<BuildContext> = {
  name: 'Validating app paths',
  onSuccess: (_, dur) => `Paths validated (${duration(dur)})`,
  run: async (ctx) => {
    validateAppPaths(ctx.mapping!)
  },
}
