import type { FunctionComponent } from 'react'
import type { PageComponentProps } from './components/PageComponent'
import type { LayoutComponentProps } from './components/LayoutComponent'
import type { LoadingComponentProps } from './components/LoadingBoundary'
import type { ErrorFallbackProps } from './components/ErrorBoundary'
import type { DefaultFallbackProps } from './components/DefaultBoundary'

export type { Params } from './types/params'
export type { RouteComponent } from './types/route-component'
export type { ComponentMap } from './types/component-map'

export type { PageComponentProps } from './components/PageComponent'
export type { LayoutComponentProps } from './components/LayoutComponent'
export type { LoadingComponentProps } from './components/LoadingBoundary'
export type { ErrorFallbackProps } from './components/ErrorBoundary'
export type { DefaultFallbackProps } from './components/DefaultBoundary'

// Convenience aliases for a role's component type - only defined here, at the
// public barrel, since internal files build FunctionComponent<XProps> inline.
export type PageComponent = FunctionComponent<PageComponentProps>
export type LayoutComponent = FunctionComponent<LayoutComponentProps>
export type LoadingComponent = FunctionComponent<LoadingComponentProps>
export type ErrorComponent = FunctionComponent<ErrorFallbackProps>
export type DefaultComponent = FunctionComponent<DefaultFallbackProps>

export { LoadingBoundary } from './components/LoadingBoundary'
export { ErrorBoundary } from './components/ErrorBoundary'
export { DefaultBoundary, notFound, DefaultSignal } from './components/DefaultBoundary'
export { isAsyncComponent } from './components/PageComponent'
export { PenApp } from './App'
