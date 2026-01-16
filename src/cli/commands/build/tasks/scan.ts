import { duration } from '@/core/build-tools'
import { buildFileTree } from '@/core/route-builder'
import { buildSegmentTree } from '@/core/route-builder'
import { buildRouteManifest } from '@/core/route-builder'

import type { Task } from '@/core/build-tools'
import type { BuildContext } from '../types'

export const scanTasks: Task<BuildContext>[] = [
  {
    name: 'Scanning filesystem...',
    onSuccess: (_, dur) => `Scanned filesystem (${duration(dur)})`,
    run: async (ctx) => ({ fileTree: buildFileTree(ctx.appDir) }),
  },
  {
    name: 'Building segment tree...',
    onSuccess: (_, dur) => `Built segment tree (${duration(dur)})`,
    run: async (ctx) => ({ segmentTree: buildSegmentTree(ctx.fileTree!) }),
  },
  {
    name: 'Generating manifest',
    onSuccess: (_, dur) => `Generated manifest (${duration(dur)})`,
    run: async (ctx) => {
      // await delay(500)  // Simulate work
      const manifest = buildRouteManifest(ctx.segmentTree!) // Safe: set by previous task
      return { manifest }
    },
  },
]
