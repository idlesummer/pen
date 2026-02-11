import type { Task } from '@idlesummer/tasker'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'
import { createFileTree, createSegmentTree, createRouteManifest, buildComponentEntries } from '@/core/route-builder'

export const scanTasks: Task<BuildContext>[] = [
  {
    name: 'Scanning filesystem...',
    onSuccess: (_, dur) => `Scanned filesystem (${duration(dur)})`,
    run: async (ctx) =>
      ({ fileTree: createFileTree(ctx.appDir) }),
  },
  {
    name: 'Building segment tree...',
    onSuccess: (_, dur) => `Built segment tree (${duration(dur)})`,
    run: async (ctx) =>
      ({ segmentTree: createSegmentTree(ctx.fileTree!) }),
  },
  {
    name: 'Generating manifest',
    onSuccess: (_, dur) => `Generated manifest (${duration(dur)})`,
    run: async (ctx) =>
      ({ manifest: createRouteManifest(ctx.segmentTree!) }),
  },
  {
    name: 'Building component entries',
    onSuccess: (_, dur) => `Built component entries (${duration(dur)})`,
    run: async (ctx) =>
      ({ componentEntries: buildComponentEntries(ctx.manifest!, ctx.outDir) }),
  },
]
