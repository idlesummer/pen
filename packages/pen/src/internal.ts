// Framework-internal exports for generated and bundled code.

// Core
export type { ModuleRole } from '@/pen-core'

// Modules
export type { ModuleNamespaceWithDefault, ModuleLoader } from '@/lib/module'
export type { ModuleRegistry } from './pen-react/modules'
export type {
  PageComponent,
  LayoutComponent,
  LoadingComponent,
  ErrorComponent,
  DefaultComponent,
} from './pen-react/modules/components'
export { createModuleRegistry } from './pen-react/modules/module-registry'

// Diagnostics
export { createDiagnosticReport } from './pen-react/diagnostics'

// Rendering
export type { RouteRendererStore } from './pen-react/renderer'
export { createRouteRenderer, createRouteRendererStore, ROUTES_CHANGED_EVENT } from './pen-react/renderer'

// Runtime
export { PenApp, PenDevApp } from './pen-react/view'
