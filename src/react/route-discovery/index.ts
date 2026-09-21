import type { PageComponent } from '../runtime/renderer/route-modules/PageComponent'
import type { LayoutComponent } from '../runtime/renderer/route-modules/LayoutComponent'
import type { LoadingComponent } from '../runtime/renderer/route-modules/LoadingBoundary'
import type { ErrorComponent } from '../runtime/renderer/route-modules/ErrorBoundary'
import type { DefaultComponent } from '../runtime/renderer/route-modules/DefaultBoundary'
import type { ComponentMap } from '../runtime/renderer/component-map'
import { GLOBAL_DEFAULT, GLOBAL_ERROR, getRouteModuleType } from '@/router'
import { ErrorFallback } from '../runtime/renderer/route-modules/ErrorBoundary'
import { DefaultFallback } from '../runtime/renderer/route-modules/DefaultBoundary'

/** Any route module's component, before it's been classified into its specific role. */
export type RouteComponent =
  PageComponent | LayoutComponent | LoadingComponent | ErrorComponent | DefaultComponent

/** The shape of a route module file - only its default export matters. */
export type RouteModule = { default: RouteComponent }

/** Discovered route modules, keyed by root-relative path (as
 *  import.meta.glob returns them), reduced to appDir-relative path ->
 *  component. */
export function toModuleByPath(modules: Record<string, RouteModule>): Map<string, RouteComponent> {
  return new Map(
    Object.entries(modules).map(([path, module]) => [path.replace(/^\/app\//, ''), module.default]),
  )
}

/** Buckets the compiled route tree's module paths by role - the two
 *  sentinels get pen's own built-in fallback, everything else its real
 *  discovered component. */
export function toComponentMap(modulePaths: string[], moduleByPath: Map<string, RouteComponent>): ComponentMap {
  const componentMap: ComponentMap = { page: {}, layout: {}, loading: {}, error: {}, default: {} }
  for (const modulePath of modulePaths) {
    const role = modulePath === GLOBAL_DEFAULT ? 'default' : modulePath === GLOBAL_ERROR ? 'error' : getRouteModuleType(modulePath)
    const component = modulePath === GLOBAL_DEFAULT ? DefaultFallback : modulePath === GLOBAL_ERROR ? ErrorFallback : moduleByPath.get(modulePath)
    ;(componentMap[role] as Record<string, unknown>)[modulePath] = component
  }
  return componentMap
}
