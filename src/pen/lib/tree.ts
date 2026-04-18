export type TraverseCallbacks<TNode> = {
  /** Called when visiting each node (pre-order). Return truthy to stop traversal. */
  visit?: (node: TNode) => unknown
  /** Returns children for a node (or creates them) */
  expand?: (node: TNode) => TNode[]
  /** Attaches a child to its parent */
  attach?: (child: TNode, parent: TNode) => void
}

/**
 * Depth-first tree traversal with pluggable callbacks.
 *
 * @example
 * traverse(root, {
 *   visit: (node) => node.name === 'target', // return true to stop
 *   expand: (node) => createChildren(node),
 *   attach: (child, parent) => parent.children.push(child)
 * })
 */
export function traverse<TNode>(root: TNode, callbacks: TraverseCallbacks<TNode>) {
  const { visit, expand, attach } = callbacks
  const stack = [root]

  while (stack.length) {
    const node = stack.pop()!
    if (visit?.(node) === true) return

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
  /** Called when visiting each ancestor node (from leaf to root) */
  visit: (node: TNode) => void
  /** Returns the parent node for a given node */
  parent: (node: TNode) => TNode | undefined
}

/**
 * Traverses the ancestor chain from a given node up to the root.
 *
 * @example
 * ancestors(node, {
 *   visit: (node) => console.log(node.name),
 *   parent: (node) => node.parent
 * })
 */
export function ancestors<TNode>(node: TNode, callbacks: AncestorCallbacks<TNode>) {
  const { visit, parent } = callbacks
  let currentNode: TNode | undefined = node

  while (currentNode) {
    visit(currentNode)
    currentNode = parent(currentNode)
  }
}
