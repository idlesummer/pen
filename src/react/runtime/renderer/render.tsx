import type { ReactNode } from 'react'
import type { RenderNode } from '@/router'
import type { ComponentMap } from './component-map'
import type { ErrorFallbackProps } from '../boundaries/ErrorBoundary'
import { Suspense } from 'react'
import { traverse } from '@/lib/traverse'
import { resolveComponent } from './component-map'
import { ErrorBoundary } from '../boundaries/ErrorBoundary'
import { DefaultBoundary } from '../boundaries/DefaultBoundary'

type RenderFrame = {
  node: RenderNode
  parent?: RenderFrame
  slotName?: string                 // the name this frame fills in its parent's slots, if any
  slots: Record<string, ReactNode>  // filled in by children as they leave
  rendered?: ReactNode              // set once this frame itself leaves
}

function createRenderFrameChildren(parent: RenderFrame): RenderFrame[] {
  if ('contentType' in parent.node)
    return []

  const slotEntries = Object.entries(parent.node.slots)
  return slotEntries.map(([slotName, node]) => ({ node, parent, slotName, slots: {} }))
}

/** Renders a router `RenderNode` tree into a React element tree.
  *
  * Resolves each node's page, layout, loading, error, and default components
  * from the build-generated `componentMap`, then composes them according to
  * the tree's slot structure. Components are resolved from the map at runtime;
  * no module loading is performed during rendering. */
export function renderNode(renderTree: RenderNode, componentMap: ComponentMap): ReactNode {
  const rootFrame: RenderFrame = { node: renderTree, slots: {} }

  traverse(rootFrame, {
    expand:
      createRenderFrameChildren,

    leave: (frame) => {
      const node = frame.node

      if ('contentType' in node) {
        const Content = resolveComponent(node.contentPath, componentMap)
        frame.rendered = <Content params={node.params} />
      }
      else {
        const { layout, loading, error, default: defaultPath } = node
        const { children, ...namedSlots } = frame.slots
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
          content = <Layout {...namedSlots}>{content}</Layout>
        }
        frame.rendered = content
      }
      if (frame.parent && frame.slotName)
        frame.parent.slots[frame.slotName] = frame.rendered
    },
  })
  return rootFrame.rendered!
}
