import type { FunctionComponent, ReactNode } from 'react'
import type { Params } from '../types/params'

/** Index signature must include Params, not just ReactNode, or `params`
 *  itself fails to satisfy its own index signature. */
export type LayoutComponent =
  FunctionComponent<{ params: Params } & Record<string, ReactNode | Params>>
