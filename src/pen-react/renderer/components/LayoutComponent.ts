import type { FunctionComponent, ReactNode } from 'react'
import type { Params } from '../types/params'

export type LayoutComponentProps =
  & Record<string, ReactNode | Params>  // must be included so `params` satisfies the index signature
  & { params: Params }

/** A layout component receiving route params and slot content. */
export type LayoutComponent = FunctionComponent<LayoutComponentProps>
