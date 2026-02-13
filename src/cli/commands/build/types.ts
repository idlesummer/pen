import { Context } from '@idlesummer/tasker'
import type { FileNode, ElementTreeMap, ComponentMap } from '@/core/compiler'
import type { SegmentNode } from '@/core/compiler/builders/segment-tree'
import type { RouteManifest } from '@/core/compiler/builders/route-manifest'

export type BuildContext = Context & {
  appDir: string
  outDir: string
  fileTree?: FileNode
  segmentTree?: SegmentNode
  manifest?: RouteManifest
  elementTrees?: ElementTreeMap
  componentMap?: ComponentMap
}
