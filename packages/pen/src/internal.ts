// Framework-internal exports - for pen's own generated/bundled code

export type { Module } from '@/lib/module'
export type {
  PageComponent,
  LayoutComponent,
  LoadingComponent,
  ErrorComponent,
  DefaultComponent,
} from './pen-react/modules/components'

import type { ModuleRegistry } from '@/pen-react/modules'
import { createRouteRenderer, ROUTES_CHANGED_EVENT, type RouteRendererStore } from './pen-react/store'
import { PenApp } from './pen-react/view'

export { createRouteRendererStore } from './pen-react/store'
export { PenApp, ROUTES_CHANGED_EVENT }
export type { RouteRendererStore }

/** Rebuilds the renderer from a fresh module registry and pushes it into an
 *  already-running store, so a live app picks up added or removed routes
 *  without restarting. */
export function updateRouteRendererStore(store: RouteRendererStore, moduleRegistry: ModuleRegistry): void {
  store.setState(() => createRouteRenderer(moduleRegistry))
}
