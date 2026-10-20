import type { FunctionComponent } from 'react'
import type { PageComponentProps } from '../components/PageComponent'
import type { LayoutComponentProps } from '../components/LayoutComponent'
import type { LoadingComponentProps } from '../components/LoadingBoundary'
import type { ErrorFallbackProps } from '../components/ErrorBoundary'
import type { DefaultFallbackProps } from '../components/DefaultBoundary'

/** Any route module's component, before it's been classified into its specific role. */
export type RouteComponent =
  | FunctionComponent<PageComponentProps>
  | FunctionComponent<LayoutComponentProps>
  | FunctionComponent<LoadingComponentProps>
  | FunctionComponent<ErrorFallbackProps>
  | FunctionComponent<DefaultFallbackProps>
