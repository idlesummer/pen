import type { Context } from '@idlesummer/tasker'
import type { FileNode, SerializedComponentTreeMap, ComponentIndexMap } from '@/pen/compiler'
import type { SegmentNode } from '@/pen/compiler/builders/segment-tree'
import type { RouteMap } from '@/pen/compiler/builders/route-table'

export type BuildContext = Context & {
  appDir: string
  outDir: string
  fileTree?: FileNode
  segmentTree?: SegmentNode
  manifest?: RouteMap
  serializedComponentTreeMap?: SerializedComponentTreeMap
  componentIndexMap?: ComponentIndexMap
}
