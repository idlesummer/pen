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
  parent: RenderFrame | null
  slotName: string | null // the name this frame fills in its parent's slots, if any
  slotResults: Record<string, ReactNode> // filled in by children as they leave
  rendered?: ReactNode // set once this frame itself leaves
}

/** Turns a router `RenderNode` into a React element tree, resolving each
 *  segment's page/layout/loading/error module from the build-generated
 *  `componentMap` - no runtime module loading involved. Walks the tree with
 *  `traverse`: `expand` describes each frame's slots, `leave` composes a
 *  frame's own element only once every slot beneath it has already resolved. */
export function renderNode(root: RenderNode, componentMap: ComponentMap): ReactNode {
  const rootFrame: RenderFrame = { node: root, parent: null, slotName: null, slotResults: {} }

  traverse(rootFrame, {
    expand: (frame) => {
      if ('contentType' in frame.node)
        return []

      return Object.entries(frame.node.slots).map(([slotName, slotNode]): RenderFrame =>
        ({ node: slotNode, parent: frame, slotName, slotResults: {} }))
    },
    leave: (frame) => {
      const { node } = frame

      if ('contentType' in node) {
        const Content = resolveComponent(node.contentPath, componentMap)
        frame.rendered = <Content params={node.params} />
      }
      else {
        const { layout, loading, error, default: defaultPath } = node
        const { children, ...namedSlots } = frame.slotResults
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
        frame.parent.slotResults[frame.slotName] = frame.rendered
    },
  })

  return rootFrame.rendered!
}
