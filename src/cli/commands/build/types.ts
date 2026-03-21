import type { Context } from '@idlesummer/tasker'
import type { RouteTreeNode } from '@/pen/compiler'

export type BuildContext = Context & {
  appDir: string
  outDir: string
  routeTree?: RouteTreeNode
}
