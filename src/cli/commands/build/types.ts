import { Context } from '@/core/build-tools'
import type { FileNode } from '@/core/route-builder'
import { SegmentNode } from '@/core/route-builder/builders/segment-tree'

export type BuildContext = Context & {
  appDir: string
  outDir: string
  fileTree?: FileNode
  segmentTree?: SegmentNode
}
