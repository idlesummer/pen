import type { ErrorComponent } from '../components/ErrorBoundary'
import type { DefaultComponent } from '../components/DefaultBoundary'
import type { LoadingComponent } from '../components/LoadingBoundary'
import type { PageComponent } from '../components/PageComponent'
import type { LayoutComponent } from '../components/LayoutComponent'

// Role-agnostic: discoverRoutes/validate check every discovered module the
// same way (is it a function? is it async?) regardless of role, so one
// union type covers every caller here.

/** Any route module's component, before it's been classified into its specific role. */
export type RouteComponent = PageComponent | LayoutComponent | LoadingComponent | ErrorComponent | DefaultComponent
