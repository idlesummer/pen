import type { FunctionComponent } from 'react'
import type { PageComponentProps } from '@/pen-react/renderer/components/PageComponent'
import type { LayoutComponentProps } from '@/pen-react/renderer/components/LayoutComponent'
import type { LoadingComponentProps } from '@/pen-react/renderer/components/LoadingBoundary'
import type { DefaultFallbackProps } from '@/pen-react/renderer/components/DefaultBoundary'
import type { ErrorFallbackProps } from '@/pen-react/renderer/components/ErrorBoundary'

export type PageComponent = FunctionComponent<PageComponentProps>
export type LayoutComponent = FunctionComponent<LayoutComponentProps>
export type LoadingComponent = FunctionComponent<LoadingComponentProps>
export type ErrorComponent = FunctionComponent<ErrorFallbackProps>
export type DefaultComponent = FunctionComponent<DefaultFallbackProps>
