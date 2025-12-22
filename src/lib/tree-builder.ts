export type TreeBuildOptions<TNode> = {
  root: TNode
  expand:  (node: TNode) => TNode[] | null        // Returns source data for node's children
  attach:  (child: TNode, parent: TNode) => void  // Attach child to parent (side effect)
  filter?: (child: TNode) => boolean              // Source to check original data w/o storing it in node
}

export function buildTreeBFS<TNode>(options: TreeBuildOptions<TNode>): TNode {
  const { root, expand, attach, filter } = options
  const queue = [root]

  for (const node of queue) {
    const children = expand(node)
    if (children === null) 
      continue

    for (const child of children) {
      attach(child, node)

      if (!filter || filter(child))
        queue.push(child)
    }
  }
  return root
}

export function buildTreeDFS<TNode>(options: TreeBuildOptions<TNode>): TNode {
  const { root, expand, attach, filter } = options
  const stack = [root]

  while (stack.length) {
    const node = stack.pop()!
    const children = expand(node)
    if (children === null)
        continue

    // Process in reverse to maintain left-to-right order when popping from stack
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
