import { traverseDepthFirst } from '@/lib/tree-utils'
import { buildComponentId } from './component-id'
import type { SegmentNode, SegmentRoles } from './segment-tree'

export type ComponentRegistry = Record<string, string>

/**
 * Builds a component registry keyed by component IDs.
 * Values are the original source file paths with extensions.
 */
export function buildComponentRegistry(segmentTree: SegmentNode): ComponentRegistry {
  const registry = new Map<string, string>()

  traverseDepthFirst<SegmentNode>({
    root: segmentTree,
    visit: (segment) => {
      const entries = Object.entries(segment.roles) as [keyof SegmentRoles, string][]

      for (const [, path] of entries) {
        if (!path) continue
        const id = buildComponentId(path)
        if (!registry.has(id))
          registry.set(id, path)
      }
    },
    expand: s => s.children,
  })

  return Object.fromEntries(registry.entries())
}
