import type { ComponentType } from 'react'
import type { ParamTable } from './ParamTable'

export type PageComponent = ComponentType<{ params: ParamTable }>
