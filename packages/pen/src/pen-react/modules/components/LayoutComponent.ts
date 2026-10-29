import type { FunctionComponent, ReactNode } from 'react'
import type { MatchParams } from '@/pen-core'

/** A layout component's props receiving route params and slot content. */
type LayoutComponentProps =
  & Record<string, ReactNode | MatchParams>  // must be included so `params` satisfies the index signature
  & { params: MatchParams }

export type LayoutComponent =
  FunctionComponent<LayoutComponentProps>
