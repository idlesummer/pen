/**
 * Tree building utilities for constructing trees via breadth-first or depth-first traversal.
 * 
 * Pattern: Use `expand` to create child nodes, `attach` to link them, and `filter` to control traversal.
 * - expand: Returns child nodes to create and attach (or undefined for leaf nodes)
 * - attach: Links child to parent (called for ALL children returned by expand)
 * - filter: Controls traversal - true = traverse child, false = attach only (don't traverse)
 * 
 * Use case: Building trees from external sources (filesystem, API) or transforming existing trees.
 */

export type TreeBuildOptions<TNode> = {
  root: TNode
  expand:  (node: TNode) => TNode[] | undefined   // Returns source data for node's children
  attach:  (child: TNode, parent: TNode) => void  // Attach child to parent (side effect)
  filter?: (child: TNode) => boolean              // Source to check original data w/o storing it in node
}

/**
 * Build a tree using breadth-first search (BFS).
 * Processes nodes level by level (all siblings before any children).
 */
export function buildTreeBFS<TNode>(options: TreeBuildOptions<TNode>): TNode {
  const { root, expand, attach, filter } = options
  const queue = [root]

  for (const node of queue) {
    const children = expand(node)
    if (!children) continue

    for (const child of children) {
      attach(child, node)

      if (!filter || filter(child))
        queue.push(child)
    }
  }
  return root
}

/**
 * Build a tree using depth-first search (DFS) with preorder traversal.
 * Processes parent before children, going deep before wide.
 */
export function buildTreeDFS<TNode>(options: TreeBuildOptions<TNode>): TNode {
  const { root, expand, attach, filter } = options
  const stack = [root]

  while (stack.length) {
    const node = stack.pop()!
    const children = expand(node)
    if (!children) continue

    // Process in reverse to maintain left-to-right
    // order when popping from stack
    const len = children.length
    for (let i = len-1; i >= 0; i--) {
      const child = children[i]
      attach(child, node)

      if (!filter || filter(child))
        stack.push(child)
    }
  }
  return root
}
