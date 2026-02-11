import { Context } from '@idlesummer/tasker'
import type { ComponentImportMap, FileNode } from '@/core/route-builder'
import type { SegmentNode } from '@/core/route-builder/builders/segment-tree'
import type { RouteManifest } from '@/core/route-builder/builders/route-manifest'

export type BuildContext = Context & {
  appDir: string
  outDir: string
  fileTree?: FileNode
  segmentTree?: SegmentNode
  manifest?: RouteManifest
  componentMap?: ComponentImportMap
}
