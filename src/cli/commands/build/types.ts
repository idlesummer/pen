import type { Context } from '@idlesummer/tasker'
import type { FileNode, SegmentNode, RouteChainMap } from '@/pen/compiler'

export type BuildContext = Context & {
  appDir: string
  outDir: string
  fileTree?: FileNode
  segmentTree?: SegmentNode
  routeChainMap?: RouteChainMap
}
