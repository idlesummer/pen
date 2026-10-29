import type { MatchParams } from '@/pen-core'
import type { FunctionComponent } from 'react'

type PageComponentProps = {
  params: MatchParams
}

export type PageComponent =
  FunctionComponent<PageComponentProps>

