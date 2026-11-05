import type { MatchParams } from '@/pen-core'
import type { FunctionComponent } from 'react'

export type PageComponent = FunctionComponent<{
  params: MatchParams
}>

