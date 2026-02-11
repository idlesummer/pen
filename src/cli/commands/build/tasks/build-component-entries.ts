import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'
import { buildComponentEntries } from '@/core/route-builder'

// ===== Main Task =====

export const buildComponents: Task<BuildContext> = {
  name: 'Building component entries',
  onSuccess: (_, dur) => `Built component entries (${duration(dur)})`,
  run: async (ctx) => ({
    componentEntries: buildComponentEntries(ctx.manifest!, ctx.outDir),
  }),
}
