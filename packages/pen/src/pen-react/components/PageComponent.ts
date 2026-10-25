import type { Params } from '@/pen-core'
import type { FunctionComponent } from 'react'

type PageComponentProps = {
  params: Params
}

export type PageComponent =
  FunctionComponent<PageComponentProps>

