  import type { FunctionComponent } from 'react'
  import type { PageComponentProps } from '@/pen-react/renderer/components/PageComponent'
  import type { LayoutComponentProps } from '@/pen-react/renderer/components/LayoutComponent'
  import type { LoadingComponentProps } from '@/pen-react/renderer/components/LoadingBoundary'
  import type { DefaultFallbackProps } from '@/pen-react/renderer/components/DefaultBoundary'
  import type { ErrorFallbackProps } from '@/pen-react/renderer/components/ErrorBoundary'

  /** Maps each route module role to its components by file path. */
  export type ComponentMap = {
    page:     Record<string, FunctionComponent<PageComponentProps> | undefined>
    layout:   Record<string, FunctionComponent<LayoutComponentProps> | undefined>
    loading:  Record<string, FunctionComponent<LoadingComponentProps> | undefined>
    error:    Record<string, FunctionComponent<ErrorFallbackProps> | undefined>
    default:  Record<string, FunctionComponent<DefaultFallbackProps> | undefined>
  }
