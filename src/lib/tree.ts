/** Callbacks for tree traversal. */
export type TraverseCallbacks<TNode> = {
  visit?: (node: TNode) => void
  expand?: (node: TNode) => TNode[]
  attach?: (child: TNode, parent: TNode) => void
}

/**
 * Depth-first tree traversal with pluggable callbacks.
 *
 * @example
 * // Visit existing tree
 * traverse(tree, {
 *   visit: (node) => console.log(node.name),
 *   expand: (node) => node.children ?? []
 * })
 *
 * @example
 * // Build new tree
 * traverse(root, {
 *   expand: (node) => createChildren(node),
 *   attach: (child, parent) => parent.children.push(child)
 * })
 */
export function traverse<TNode>(root: TNode, callbacks: TraverseCallbacks<TNode>) {
  const { visit, expand, attach } = callbacks
  const stack = [root]

  while (stack.length) {
    const node = stack.pop()!
    visit?.(node)

    // Process children in reverse so
    // they're popped in correct order
    const children = expand?.(node) ?? []

    for (let i = children.length-1; i >= 0; i--) {
      const child = children[i]!
      attach?.(child, node)
      stack.push(child)
    }
  }
}
