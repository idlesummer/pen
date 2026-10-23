import type { FunctionComponent, ReactNode } from 'react'
import type { Params } from '@/pen-core'

/** A layout component's props receiving route params and slot content. */
type LayoutComponentProps =
  & Record<string, ReactNode | Params>  // must be included so `params` satisfies the index signature
  & { params: Params }

export type LayoutComponent =
  FunctionComponent<LayoutComponentProps>
