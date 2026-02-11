import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'
import { createFileTree } from '@/core/route-builder'

// ===== Main Task =====

export const scanFilesystem: Task<BuildContext> = {
  name: 'Scanning filesystem...',
  onSuccess: (_, dur) => `Scanned filesystem (${duration(dur)})`,
  run: async (ctx) => ({ fileTree: createFileTree(ctx.appDir) }),
}
