import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'
import { createRouteManifest } from '@/core/route-builder'

// ===== Main Task =====

export const generateManifest: Task<BuildContext> = {
  name: 'Generating manifest',
  onSuccess: (_, dur) => `Generated manifest (${duration(dur)})`,
  run: async (ctx) => ({ manifest: createRouteManifest(ctx.segmentTree!) }),
}
