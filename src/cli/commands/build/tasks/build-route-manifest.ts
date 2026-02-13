import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'
import { createRouteManifest } from '@/core/route-builder'

// ===== Main Task =====

export const buildRouteManifest: Task<BuildContext> = {
  name: 'Building route manifest',
  onSuccess: (_, dur) => `Built route manifest (${duration(dur)})`,
  run: async (ctx) => ({
    manifest: createRouteManifest(ctx.segmentTree!, ctx.outDir),
  }),
}
