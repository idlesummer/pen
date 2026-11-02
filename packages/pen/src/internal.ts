// Framework-internal exports - for pen's own generated/bundled code

export type { ModuleNamespaceWithDefault } from '@/lib/module'
export type { ModuleRole } from '@/pen-core'
export type {
  PageComponent,
  LayoutComponent,
  LoadingComponent,
  ErrorComponent,
  DefaultComponent,
} from './pen-react/modules/components'

export { createModuleRegistry } from './pen-react/modules/module-registry'
import { createRouteRenderer, ROUTES_CHANGED_EVENT, type RouteRendererStore } from './pen-react/renderer'
import { PenApp, PenDevApp } from './pen-react/view'

export { createDiagnosticReport } from './pen-react/diagnostics'
export { createRouteRendererStore } from './pen-react/renderer'
export { PenApp, PenDevApp, createRouteRenderer, ROUTES_CHANGED_EVENT }
export type { RouteRendererStore }
export type { ModuleLoader } from './lib/module'
