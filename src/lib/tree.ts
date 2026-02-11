/** Callbacks for tree traversal. */
export type TraverseCallbacks<TNode> = {
  /** Called when visiting each node (pre-order) */
  visit?: (node: TNode) => void
  /** Returns children for a node (or creates them) */
  expand?: (node: TNode) => TNode[]
  /** Attaches a child to its parent */
  attach?: (child: TNode, parent: TNode) => void
}


/**
 * Depth-first tree traversal with pluggable callbacks.
 *
 * @template TNode - The type of tree nodes
 * @param root - The root node to start traversal from
 * @param callbacks - Callbacks for visit, expand, and attach operations
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

export type AncestorCallbacks<TNode> = {
  visit: (node: TNode) => void
  parent: (node: TNode) => TNode | undefined
}

export function ancestors<TNode>(node: TNode, callbacks: AncestorCallbacks<TNode>) {
  const { visit, parent } = callbacks
  let currentNode: TNode | undefined = node

  while (currentNode) {
    visit(currentNode)
    currentNode = parent(currentNode)
  }
}
