import type { FunctionComponent, ReactNode } from 'react'
import type { MatchParams } from '@/pen-core'

export type LayoutComponent = FunctionComponent<
  & Record<string, ReactNode | MatchParams>  // must be included so `params` satisfies the index signature
  & { params: MatchParams }
>
