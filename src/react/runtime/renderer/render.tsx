import type { ReactNode } from 'react'
import type { Layer, RenderPlan } from '@/router'
import type { ComponentMap } from './component-map'
import type { ErrorFallbackProps } from '../boundaries/ErrorBoundary'
import { Suspense } from 'react'
import { resolveComponent } from './component-map'
import { ErrorBoundary } from '../boundaries/ErrorBoundary'
import { DefaultBoundary } from '../boundaries/DefaultBoundary'

/** Wraps already-resolved `content` in whichever of a layer's default/error/
 *  loading/layout modules are present, innermost first. A layer's named slots
 *  are rendered as plans of their own and handed to its layout. */
function wrapLayer(layer: Layer, content: ReactNode, componentMap: ComponentMap): ReactNode {
  const { layout, loading, error, default: defaultPath, slots } = layer

  if (defaultPath) {
    const Fallback = resolveComponent(defaultPath, componentMap)
    content = <DefaultBoundary fallback={Fallback}>{content}</DefaultBoundary>
  }
  if (error) {
    const Fallback = resolveComponent<ErrorFallbackProps>(error, componentMap)
    content = <ErrorBoundary fallback={Fallback}>{content}</ErrorBoundary>
  }
  if (loading) {
    const Loading = resolveComponent(loading, componentMap)
    content = <Suspense fallback={<Loading />}>{content}</Suspense>
  }
  if (layout) {
    const Layout = resolveComponent(layout, componentMap)
    const namedSlots: Record<string, ReactNode> = {}
    for (const slotName in slots)
      namedSlots[slotName] = renderPlan(slots[slotName]!, componentMap)
    content = <Layout params={layer.params} {...namedSlots}>{content}</Layout>
  }
  return content
}

/** Turns a router `RenderPlan` into a React element tree: resolve the content,
 *  then fold the layers around it from the inside out. The router already
 *  decided every layer and every slot, so there is nothing to walk and no case
 *  to distinguish - a named slot is just another plan. */
export function renderPlan(plan: RenderPlan, componentMap: ComponentMap): ReactNode {
  const Content = resolveComponent(plan.content, componentMap)
  let content: ReactNode = <Content params={plan.params} />

  for (let index = plan.layers.length-1; index >= 0; index--)
    content = wrapLayer(plan.layers[index]!, content, componentMap)
  return content
}
