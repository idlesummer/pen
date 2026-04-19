import type { Context } from '@idlesummer/tasker'
import type { RouteNode, RolesMapping, RoutesBuckets } from '@/pen/compiler'

export type BuildContext = Context & {
  appDir: string
  outDir: string
  files?: string[]
  mapping?: RolesMapping
  buckets?: RoutesBuckets
  routeTree?: RouteNode
}
