import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'
import { buildComponentImports } from '@/core/route-builder'

// ===== Main Task =====

export const buildComponents: Task<BuildContext> = {
  name: 'Building component imports',
  onSuccess: (_, dur) => `Built component imports (${duration(dur)})`,
  run: async (ctx) => ({
    componentImports: buildComponentImports(ctx.manifest!, ctx.outDir),
  }),
}
