import * as format from '@/core/build-tools'
import { buildFileTree } from '@/core/route-builder'
import { buildSegmentTree } from '@/core/route-builder'

import type { Task } from '@/core/build-tools'
import type { BuildContext } from '../types'

export const scanTasks: Task<BuildContext>[] = [
  {
    name: 'Scanning filesystem...',
    onSuccess: (_, duration) => `Scanned filesystem (${format.duration(duration)})`,
    run: async (ctx) => ({ fileTree: buildFileTree(ctx.appDir) }),
  },
  {
    name: 'Building segment tree...',
    onSuccess: (_, duration) => `Built segment tree (${format.duration(duration)})`,
    run: async (ctx) => ({ segmentTree: buildSegmentTree(ctx.fileTree!) }),
  },
]
