import type { Module } from '@/pen-core'
import type { ErrorComponent } from './components/ErrorBoundary'
import type { DefaultComponent } from './components/DefaultBoundary'
import type { LoadingComponent } from './components/LoadingBoundary'
import type { PageComponent } from './components/PageComponent'
import type { LayoutComponent } from './components/LayoutComponent'

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

/** Any route module's component, before it's been classified into its specific role. */
export type RouteComponent = PageComponent | LayoutComponent | LoadingComponent | ErrorComponent | DefaultComponent

/** The shape of a route module file. */
export type RouteModule = Module<RouteComponent>
