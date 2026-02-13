import { Context } from '@idlesummer/tasker'
import type { FileNode, ElementTreeMap, ComponentMap } from '@/pen/compiler'
import type { SegmentNode } from '@/pen/compiler/builders/segment-tree'
import type { RouteManifest } from '@/pen/compiler/builders/route-manifest'

export type BuildContext = Context & {
  appDir: string
  outDir: string
  fileTree?: FileNode
  segmentTree?: SegmentNode
  manifest?: RouteManifest
  elementTrees?: ElementTreeMap
  componentMap?: ComponentMap
}
