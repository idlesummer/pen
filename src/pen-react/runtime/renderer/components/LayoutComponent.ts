import type { FunctionComponent, ReactNode } from 'react'
import type { ParamTable } from '../types/param-table'

type LayoutComponentProps =
  & Record<string, ReactNode | ParamTable>  // must be included so `params` satisfies the index signature
  & { params: ParamTable }

/** A layout component receiving route params and slot content. */
export type LayoutComponent = FunctionComponent<LayoutComponentProps>
