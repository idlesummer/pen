import type { PageComponent } from './PageComponent'
import type { LayoutComponent } from './LayoutComponent'
import type { LoadingComponent } from './LoadingBoundary'
import type { ErrorComponent } from './ErrorBoundary'
import type { DefaultComponent } from './DefaultBoundary'

/** Any route module's component, before it's been classified into its
 *  specific role. */
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
