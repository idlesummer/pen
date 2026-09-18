import type { ComponentType } from 'react'
import type { ParamTable } from '../params'

export type PageComponent = ComponentType<{ params: ParamTable }>
