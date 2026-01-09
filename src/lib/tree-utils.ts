export type TraversalOptions<TNode> = {
  root: TNode
  visit?:  (node: TNode) => void                 // Inspect/process current node
  expand?: (node: TNode) => TNode[] | undefined  // Get/create child nodes
  attach?: (child: TNode, parent: TNode) => void // Link child to parent
  filter?: (child: TNode) => boolean             // Control child traversal
}

/**
 * Traverse tree breadth-first (level by level).
 * Processes all siblings before any children.
 */
export function traverseBreadthFirst<TNode>(options: TraversalOptions<TNode>): TNode {
  const { root, visit, expand, attach, filter } = options
  const queue = [root]

  for (const node of queue) {
    visit?.(node)

    const children = expand?.(node)
    if (!children) continue

    for (const child of children) {
      attach?.(child, node)

      if (!filter || filter(child))
        queue.push(child)
    }
  }
  return root
}

/**
 * Traverse tree depth-first with preorder traversal.
 * Processes parent before children, going deep before wide.
 */
export function traverseDepthFirst<TNode>(options: TraversalOptions<TNode>): TNode {
  const { root, visit, expand, attach, filter } = options
  const stack = [root]

  while (stack.length) {
    const node = stack.pop()!
    visit?.(node)

    const children = expand?.(node)
    if (!children) continue

    // Process in reverse to maintain left-to-right
    // order when popping from stack
    const len = children.length
    for (let i = len-1; i >= 0; i--) {
      const child = children[i]!
      attach?.(child, node)

      if (!filter || filter(child))
        stack.push(child)
    }
  }
  return root
}

/**
 * Collect values by walking up from a source node to root.
 * Returns results in leaf → root order.
 */
export function collectAncestors<TreeNode extends { parent?: TreeNode }, R>(
  node: TreeNode,
  mapper: (node: TreeNode) => R,
): R[] {

  const results: R[] = []
  let currentNode = node

  while (true) {
    results.push(mapper(currentNode))
    if (!currentNode.parent)
      break
    currentNode = currentNode.parent
  }

  return results
}
