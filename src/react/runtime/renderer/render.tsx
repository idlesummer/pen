import type { ReactNode } from 'react'
import type { RenderNode } from '@/router'
import type { ComponentMap } from './component-map'
import type { ErrorFallbackProps } from '../boundaries/ErrorBoundary'
import { Suspense } from 'react'
import { traverse } from '@/lib/traverse'
import { resolveComponent } from './component-map'
import { ErrorBoundary } from '../boundaries/ErrorBoundary'
import { DefaultBoundary } from '../boundaries/DefaultBoundary'

/** Wraps already-resolved `content` in whichever of a node's default/error/
 *  loading/layout modules are present - the one place this composition
 *  happens, shared by both the main spine (`renderNode`) and a slot's own
 *  chain (`renderChain`). */
function wrapContent(node: RenderNode, content: ReactNode, namedSlots: Record<string, ReactNode>, componentMap: ComponentMap): ReactNode {
  const { layout, loading, error, default: defaultPath } = node

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
  return content
}

/** Resolves a node's own subtree by walking straight down through nested
 *  `slots.children` until a leaf is hit - safe because a slot's own subtree
 *  can never fork into a second named slot of its own (render-tree.ts only
 *  ever calls wrapRenderNode without a slots argument inside a slot's own
 *  chain). Used for named slots only - the main spine goes through renderNode. */
function renderChain(node: RenderNode, componentMap: ComponentMap): ReactNode {
  if ('contentType' in node) {
    const Content = resolveComponent(node.contentPath, componentMap)
    return <Content params={node.params} />
  }
  const content = renderChain(node.slots.children!, componentMap)
  return wrapContent(node, content, {}, componentMap) // no named slots to spread inside a slot's own chain
}

type RenderFrame = {
  node: RenderNode
  parent?: RenderFrame
  child?: ReactNode // filled in once this frame's own children-link leaves
  content?: ReactNode // set once this frame itself leaves
}

/** Turns a router `RenderNode` into a React element tree. The main spine
 *  (the `children` chain) walks via `traverse`; each named slot along the
 *  way is resolved separately via `renderChain`, since it can never fork
 *  again on its own. */
export function renderNode(root: RenderNode, componentMap: ComponentMap): ReactNode {
  const rootFrame: RenderFrame = { node: root }

  traverse(rootFrame, {
    expand: (frame) => {
      if ('contentType' in frame.node)
        return []
      return [{ node: frame.node.slots.children!, parent: frame }]
    },
    leave: (frame) => {
      const node = frame.node

      if ('contentType' in node) {
        const Content = resolveComponent(node.contentPath, componentMap)
        frame.content = <Content params={node.params} />
      }
      else {
        const resolvedSlots: Record<string, ReactNode> = {}
        for (const [slotName, slotNode] of Object.entries(node.slots))
          if (slotName !== 'children')
            resolvedSlots[slotName] = renderChain(slotNode, componentMap)

        frame.content = wrapContent(node, frame.child, resolvedSlots, componentMap)
      }
      if (frame.parent)
        frame.parent.child = frame.content
    },
  })
  return rootFrame.content!
}
