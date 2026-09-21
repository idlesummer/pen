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
