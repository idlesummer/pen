import type { Params } from '@/pen-react/renderer/types/params'
import type { FunctionComponent } from 'react'

type PageComponentProps = {
  params: Params
}

export type PageComponent =
  FunctionComponent<PageComponentProps>

