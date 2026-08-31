import type { ReactNode } from 'react'
import type { RenderNode } from '@/router'
import type { ComponentMap } from './component-map'
import type { ErrorFallbackProps } from '../boundaries/ErrorBoundary'
import { Suspense } from 'react'
import { traverse } from '@/lib/traverse'
import { resolveComponent } from './component-map'
import { ErrorBoundary } from '../boundaries/ErrorBoundary'
import { DefaultBoundary } from '../boundaries/DefaultBoundary'

type WalkNode = {
  raw: RenderNode
  parent: WalkNode | null
  slotName: string | null // the name this node fills in its parent's slots, if any
  slotResults: Record<string, ReactNode> // filled in by children as they leave
  rendered?: ReactNode // set once this node itself leaves
}

/** Turns a router `RenderNode` into a React element tree, resolving each
 *  segment's page/layout/loading/error module from the build-generated
 *  `componentMap` - no runtime module loading involved. Walks the tree with
 *  `traverse`: `expand` describes each node's slots, `leave` composes a
 *  node's own element only once every slot beneath it has already resolved. */
export function renderNode(root: RenderNode, componentMap: ComponentMap): ReactNode {
  const rootWalk: WalkNode = { raw: root, parent: null, slotName: null, slotResults: {} }

  traverse(rootWalk, {
    expand: (walkNode) => {
      if ('contentType' in walkNode.raw)
        return []

      return Object.entries(walkNode.raw.slots).map(([slotName, slotNode]): WalkNode =>
        ({ raw: slotNode, parent: walkNode, slotName, slotResults: {} }))
    },
    leave: (walkNode) => {
      const { raw } = walkNode

      if ('contentType' in raw) {
        const Content = resolveComponent(raw.contentPath, componentMap)
        walkNode.rendered = <Content params={raw.params} />
      }
      else {
        const { layout, loading, error, default: defaultPath } = raw
        const { children, ...namedSlots } = walkNode.slotResults
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
        walkNode.rendered = content
      }

      if (walkNode.parent && walkNode.slotName)
        walkNode.parent.slotResults[walkNode.slotName] = walkNode.rendered
    },
  })

  return rootWalk.rendered!
}
