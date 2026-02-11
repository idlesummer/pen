import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'
import { buildFileTree, buildSegmentTree, buildRouteManifest } from '@/core/route-builder'

export const scanTasks: Task<BuildContext>[] = [
  {
    name: 'Scanning filesystem...',
    onSuccess: (_, dur) => `Scanned filesystem (${duration(dur)})`,
    run: async (ctx) =>
      ({ fileTree: buildFileTree(ctx.appDir) }),
  },
  {
    name: 'Building segment tree...',
    onSuccess: (_, dur) => `Built segment tree (${duration(dur)})`,
    run: async (ctx) =>
      ({ segmentTree: buildSegmentTree(ctx.fileTree!) }),
  },
  {
    name: 'Generating manifest',
    onSuccess: (_, dur) => `Generated manifest (${duration(dur)})`,
    run: async (ctx) => {
      // await delay(500)  // Simulate work
      const manifest = buildRouteManifest(ctx.segmentTree!)
      return { manifest }
    },
  },
]
