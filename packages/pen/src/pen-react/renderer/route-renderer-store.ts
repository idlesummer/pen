import type { Store } from '@/lib/create-store'
import type { ModuleRegistry } from '@/pen-react/modules'
import type { RouteRenderer } from './route-renderer'
import { createRouteRenderer } from './route-renderer'
import { createStore } from '@/lib/create-store'

export type RouteRendererStore = Store<RouteRenderer>

export function createRouteRendererStore(moduleRegistry: ModuleRegistry): RouteRendererStore {
  const renderer = createRouteRenderer(moduleRegistry)
  const store = createStore(renderer)
  return store
}
