import * as format from '@/core/build-tools'
import { buildFileTree } from '@/core/route-builder'

import type { Task } from '@/core/build-tools'
import type { BuildContext } from '../types'

export const scanTasks: Task<BuildContext>[] = [
  {
    name: 'Scanning filesystem...',
    onSuccess: (_, duration) => `Scanned filesystem (${format.duration(duration)})`,
    run: async (ctx) => ({ fileTree: buildFileTree(ctx.appDir) }),
  },
  // {
  //   name: 'Building segment tree...',
  //   onSuccess: (_, ctx) => `Built route tree (${format.duration(ctx.duration)})`,
  //   run: async (ctx) => ({ routeTree: buildSegmentTree(ctx.fileTree!) }),
  // },
]
