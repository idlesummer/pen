import type { ComponentType, ReactNode } from 'react'
import type { ParamTable } from './ParamTable'

/** Index signature must include ParamTable, not just ReactNode, or `params`
 *  itself fails to satisfy its own index signature. */
export type LayoutComponent =
  ComponentType<{ params: ParamTable } & Record<string, ReactNode | ParamTable>>
