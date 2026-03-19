import type { PropsWithChildren } from 'react'
import { createContext } from 'react'

export type DynamicParams = Record<string, string | string[]>
export const DynamicParamsContext = createContext<DynamicParams>({})
export type DynamicParamsProviderProps = PropsWithChildren<{
  params: DynamicParams
}>

export function DynamicParamsProvider({ params, children }: DynamicParamsProviderProps) {
  return (
    <DynamicParamsContext.Provider value={params}>
      {children}
    </DynamicParamsContext.Provider>
  )
}
