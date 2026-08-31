import type { ReactNode } from 'react'
import type { RenderNode } from '@/router'
import type { ComponentMap } from './component-map'
import type { ErrorFallbackProps } from '../boundaries/ErrorBoundary'
import { Suspense } from 'react'
import { resolveComponent } from './component-map'
import { ErrorBoundary } from '../boundaries/ErrorBoundary'
import { DefaultBoundary } from '../boundaries/DefaultBoundary'

/** Recursively turns a router `RenderNode` into a React element tree,
 *  resolving each segment's page/layout/loading/error module from the
 *  build-generated `componentMap` - no runtime module loading involved. */
export function renderNode(node: RenderNode, componentMap: ComponentMap): ReactNode {
  if ('contentType' in node) {
    const Content = resolveComponent(node.contentPath, componentMap)
    return <Content params={node.params} />
  }

  const { layout, loading, error, default: defaultPath, slots } = node
  const rendered: Record<string, ReactNode> = {}
  for (const [slotName, slotNode] of Object.entries(slots))
    rendered[slotName] = renderNode(slotNode, componentMap)

  const { children, ...namedSlots } = rendered
  let content = children

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
    return <Layout {...namedSlots}>{content}</Layout>
  }
  return content
}
