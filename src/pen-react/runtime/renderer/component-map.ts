import type { ErrorComponent } from './components/ErrorBoundary'
import type { DefaultComponent } from './components/DefaultBoundary'
import type { LoadingComponent } from './components/LoadingBoundary'
import type { PageComponent } from './components/PageComponent'
import type { LayoutComponent } from './components/LayoutComponent'
import { GLOBAL_DEFAULT, GLOBAL_ERROR } from '@/pen-core'
import { DefaultFallback } from './components/DefaultBoundary'
import { ErrorFallback } from './components/ErrorBoundary'

/** One bucket per route module role; every module in a bucket shares that
 *  role's real prop shape. */
export type ComponentMap = {
  page: Record<string, PageComponent>
  layout: Record<string, LayoutComponent>
  loading: Record<string, LoadingComponent>
  error: Record<string, ErrorComponent>
  default: Record<string, DefaultComponent>
}

/** Any route module's component, before it's been classified into its specific role. */
export type RouteComponent = PageComponent | LayoutComponent | LoadingComponent | ErrorComponent | DefaultComponent

/** The shape of a route module file. */
export type RouteModule = { default: RouteComponent }

/** Attaches the two built-in fallbacks to a components record, keyed by
 *  their sentinel paths. Shared by both places that build one from
 *  discovered route modules - the plugin's pre-build validation pass and
 *  the generated entry module's real bundle. */
export function attachFallbackComponents(components: Record<string, RouteComponent | undefined>): Record<string, RouteComponent | undefined> {
  components[GLOBAL_DEFAULT] = DefaultFallback
  components[GLOBAL_ERROR] = ErrorFallback
  return components
}
