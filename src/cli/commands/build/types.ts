import type { Context } from '@idlesummer/tasker'
import type { RouteNode } from '@/pen/compiler'

export type BuildContext = Context & {
  appDir: string
  outDir: string
  routeTree?: RouteNode
}
