import type { RouteTreeNode, SegmentLayer } from '@/pen/compiler'

/**
 * Converts a root-to-leaf node sequence into a leaf-to-root chain of SegmentLayer.
 * Screens are stripped from all non-leaf nodes (only the leaf's screen renders).
 * Nodes with no remaining roles after stripping are omitted from the chain.
 */
export function buildSegmentLayerChain(routePath: RouteTreeNode[]): SegmentLayer[] {
  const chain: SegmentLayer[] = []
  const leaf = routePath[routePath.length-1]!
  if (leaf.roles && Object.keys(leaf.roles).length)
    chain.push({ ...leaf.roles })

  for (let i = routePath.length-2; i >= 0; i--) {
    const { screen: _, ...roles } = routePath[i]!.roles ?? {}
    if (Object.keys(roles).length)
      chain.push(roles)
  }
  return chain
}
