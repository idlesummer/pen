import { Context } from '@idlesummer/tasker'
import type { FileNode, ElementTreeMap, ComponentMap } from '@/pen/compiler'
import type { SegmentNode } from '@/pen/compiler/builders/segment-tree'
import type { RouteTable } from '@/pen/compiler/builders/route-manifest'

export type BuildContext = Context & {
  appDir: string
  outDir: string
  fileTree?: FileNode
  segmentTree?: SegmentNode
  manifest?: RouteTable
  elementTrees?: ElementTreeMap
  componentMap?: ComponentMap
}
