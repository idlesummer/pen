import type { ErrorComponent } from '../../renderer/components/ErrorBoundary'
import type { DefaultComponent } from '../../renderer/components/DefaultBoundary'
import type { LoadingComponent } from '../../renderer/components/LoadingBoundary'
import type { PageComponent } from '../../renderer/components/PageComponent'
import type { LayoutComponent } from '../../renderer/components/LayoutComponent'

// Role-agnostic: discoverRoutes/validate check every discovered module the
// same way (is it a function? is it async?) regardless of role, so one
// union type covers every caller here.

/** Any route module's component, before it's been classified into its specific role. */
export type RouteComponent = PageComponent | LayoutComponent | LoadingComponent | ErrorComponent | DefaultComponent
