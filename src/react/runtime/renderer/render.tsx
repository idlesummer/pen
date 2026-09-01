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
  renderNode: RenderNode
  parent?: RenderFrame
  slotName?: string                     // the name this frame fills in its parent's slotNodes, if any
  slotNodes: Record<string, ReactNode>  // filled in by children as they leave
  rendered?: ReactNode                  // set once this frame itself leaves
}

function createRenderFrame(renderNode: RenderNode, parent?: RenderFrame, slotName?: string): RenderFrame {
  return { renderNode, parent, slotName, slotNodes: {} }
}

function createRenderFrameChildren(parent: RenderFrame): RenderFrame[] {
  if ('contentType' in parent.renderNode)
    return [] // if content type exists then render renderNode is a leaf (has no children)

  const slots = Object.entries(parent.renderNode.slots)
  return slots.map(([slotName, slotNode]) => createRenderFrame(slotNode, parent, slotName))
}

/** Renders a router `RenderNode` tree into a React element tree.
  *
  * Resolves each renderNode's page, layout, loading, error, and default components
  * from the build-generated `componentMap`, then composes them according to
  * the tree's slot structure. Components are resolved from the map at runtime;
  * no module loading is performed during rendering. */
export function renderNode(renderTree: RenderNode, componentMap: ComponentMap): ReactNode {
  const rootFrame = createRenderFrame(renderTree)

  traverse(rootFrame, {
    expand:
      createRenderFrameChildren,

    leave: (renderFrame) => {
      const renderNode = renderFrame.renderNode

      if ('contentType' in renderNode) {
        const Content = resolveComponent(renderNode.contentPath, componentMap)
        renderFrame.rendered = <Content params={renderNode.params} />
      }
      else {
        const { layout, loading, error, default: defaultPath } = renderNode
        const { children, ...slotNodes } = renderFrame.slotNodes
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
          content = <Layout {...slotNodes}>{content}</Layout>
        }
        renderFrame.rendered = content
      }
      if (renderFrame.parent && renderFrame.slotName)
        renderFrame.parent.slotNodes[renderFrame.slotName] = renderFrame.rendered
    },
  })
  return rootFrame.rendered!
}
