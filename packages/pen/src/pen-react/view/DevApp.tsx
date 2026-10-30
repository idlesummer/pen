import type { RouteRendererStore } from '@/pen-react/renderer'
import { useSyncExternalStore } from 'react'
import { PenApp } from './App'

export type DevPenAppProps = {
  rendererStore: RouteRendererStore
}

export function DevApp({ rendererStore }: DevPenAppProps) {
  const routeRenderer = useSyncExternalStore(rendererStore.subscribe, rendererStore.getState)
  return <PenApp routeRenderer={routeRenderer} />
}
