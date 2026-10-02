import type { Module } from '@/pen-core'
import type { ErrorComponent } from './ErrorBoundary'
import type { DefaultComponent } from './DefaultBoundary'
import type { LoadingComponent } from './LoadingBoundary'
import type { PageComponent } from './PageComponent'
import type { LayoutComponent } from './LayoutComponent'

// ── build ────────────────────────────────────────────────────────────────
// Role-agnostic: build.ts validates every discovered module the same way
// (is it a function? is it async?) regardless of role, so one union type
// covers every caller here.

/** Any route module's component, before it's been classified into its specific role. */
export type RouteComponent = PageComponent | LayoutComponent | LoadingComponent | ErrorComponent | DefaultComponent

/** The shape of a route module file. */
export type RouteModule = Module<RouteComponent>

// ── start ────────────────────────────────────────────────────────────────
// Role-bucketed: render.tsx calls each role's components with that role's
// own props (params, slots, error, ...), so each bucket needs its own
// specific component type instead of the union above.

/** One bucket per route module role; every module in a bucket shares that
 *  role's real prop shape. Lookups can still miss a key - wrapFrame/
 *  renderChain trust specific keys exist because they come from the same
 *  compiled route tree that produced this map. */
export type ComponentMap = {
  page: Record<string, PageComponent | undefined>
  layout: Record<string, LayoutComponent | undefined>
  loading: Record<string, LoadingComponent | undefined>
  error: Record<string, ErrorComponent | undefined>
  default: Record<string, DefaultComponent | undefined>
}
