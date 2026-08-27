import type { ReactNode } from 'react'
import type { RenderNode } from '@/pen/router'
import { Suspense, use } from 'react'
import { ErrorBoundary } from './error-boundary'
import { loadModule } from './module-loader'

type LazyContentProps = {
  path: string
  props?: Record<string, unknown>
}

function LazyContent({ path, props }: LazyContentProps) {
  // eslint-disable-next-line @eslint-react/static-components -- resolved by `use()`, not created here
  const Component = use(loadModule(path))
  // eslint-disable-next-line @eslint-react/static-components -- resolved by `use()`, not created here
  return <Component {...props} />
}

function renderSlots(slots: Record<string, RenderNode>): Record<string, ReactNode> {
  const rendered: Record<string, ReactNode> = {}
  for (const [slotName, slotNode] of Object.entries(slots))
    rendered[slotName] = renderNode(slotNode)
  return rendered
}

/** Recursively turns a router `RenderNode` into a React element tree,
 *  lazily loading each segment's page/layout/loading/error module on demand. */
export function renderNode(node: RenderNode): ReactNode {
  if ('contentType' in node)
    return <LazyContent path={node.contentPath} props={{ params: node.params }} />

  const { layout, loading, error, slots } = node
  const { children, ...namedSlots } = renderSlots(slots)
  let content = children

  if (error)
    content = <ErrorBoundary path={error}>{content}</ErrorBoundary>
  if (loading)
    content = <Suspense fallback={<LazyContent path={loading} />}>{content}</Suspense>

  return layout
    ? <LazyContent path={layout} props={{ ...namedSlots, children: content }} />
    : content
}
