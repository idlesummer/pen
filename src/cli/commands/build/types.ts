import type { Context } from '@idlesummer/tasker'
import type { FileNode, SerializedRoutes, ComponentIdMap } from '@/pen/compiler'
import type { SegmentNode } from '@/pen/compiler/builders/segment-tree'
import type { RouteChainMap } from '@/pen/compiler/builders/route-chain-map'

export type BuildContext = Context & {
  appDir: string
  outDir: string
  fileTree?: FileNode
  segmentTree?: SegmentNode
  routeChainMap?: RouteChainMap
  serializedRoutes?: SerializedRoutes
  componentIdMap?: ComponentIdMap
}
