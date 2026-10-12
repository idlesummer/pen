import type { ErrorComponent } from '../components/ErrorBoundary'
import type { DefaultComponent } from '../components/DefaultBoundary'
import type { LoadingComponent } from '../components/LoadingBoundary'
import type { PageComponent } from '../components/PageComponent'
import type { LayoutComponent } from '../components/LayoutComponent'

/** Any route module's component, before it's been classified into its specific role. */
export type RouteComponent =
  | PageComponent
  | LayoutComponent
  | LoadingComponent
  | ErrorComponent
  | DefaultComponent
