import type { ComponentType, ReactNode } from 'react'
import type { RenderNode } from '@/router'
import type { ComponentMap } from './component-map'
import type { ErrorFallbackProps } from './ErrorBoundary'
import { Suspense } from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { DefaultBoundary } from './DefaultBoundary'

/** Looks up a route module's component by path. The specific prop shape
 *  (`TProps`) can't be verified statically - it's resolved from a path
 *  string at runtime - so callers assert the shape they expect. */
function resolveComponent<TProps extends object = Record<string, unknown>>(path: string, componentMap: ComponentMap): ComponentType<TProps> {
  const Component = componentMap[path]
  if (!Component)
    throw new Error(`No component registered for route module "${path}". Regenerate the route builder output.`)
  return Component as unknown as ComponentType<TProps>
}

function renderSlots(slots: Record<string, RenderNode>, componentMap: ComponentMap): Record<string, ReactNode> {
  const rendered: Record<string, ReactNode> = {}
  for (const [slotName, slotNode] of Object.entries(slots))
    rendered[slotName] = renderNode(slotNode, componentMap)
  return rendered
}

/** Recursively turns a router `RenderNode` into a React element tree,
 *  resolving each segment's page/layout/loading/error module from the
 *  build-generated `componentMap` - no runtime module loading involved. */
export function renderNode(node: RenderNode, componentMap: ComponentMap): ReactNode {
  if ('contentType' in node) {
    const Content = resolveComponent(node.contentPath, componentMap)
    return <Content params={node.params} />
  }

  const { layout, loading, error, default: defaultPath, slots } = node
  const { children, ...namedSlots } = renderSlots(slots, componentMap)
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
