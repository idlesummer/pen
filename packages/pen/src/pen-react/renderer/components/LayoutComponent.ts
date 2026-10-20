import type { ReactNode } from 'react'
import type { Params } from '@/pen-react/renderer/types/params'

/** A layout component's props receiving route params and slot content. */
export type LayoutComponentProps =
  & Record<string, ReactNode | Params>  // must be included so `params` satisfies the index signature
  & { params: Params }
