// Framework-internal exports - for pen's own generated/bundled code

export type { Module } from '@/lib/module'
export type {
  PageComponent,
  LayoutComponent,
  LoadingComponent,
  ErrorComponent,
  DefaultComponent,
} from './pen-react/modules/components'

import { createRouteRenderer, ROUTES_CHANGED_EVENT, type RouteRendererStore } from './pen-react/renderer'
import { PenApp, PenDevApp } from './pen-react/view'

export { createRouteRendererStore } from './pen-react/renderer'
export { createModuleRegistry } from './pen-react/modules'
export { PenApp, PenDevApp, createRouteRenderer, ROUTES_CHANGED_EVENT }
export type { RouteRendererStore }
