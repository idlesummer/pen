export type TreeBuildOptions<TNode, TRaw> = {
  root: TNode
  expand: (node: TNode) => TRaw[]                       // Returns raw data for node's children
  createChild: (raw: TRaw, parent: TNode) => TNode      // Transform raw data into child nodes
  attach: (child: TNode, parent: TNode) => void         // Attach child to parent (side effect)
  shouldTraverse?: (child: TNode, raw: TRaw) => boolean // Raw lets you check original data without storing it in the node
}

export function buildTreeBFS<TNode, TRaw>(options: TreeBuildOptions<TNode, TRaw>): TNode {
  const { root, expand, createChild, attach, shouldTraverse } = options
  const queue = [root]

  for (const node of queue) {
    for (const raw of expand(node)) {
      const child = createChild(raw, node)      // raw = data to transform; node = parent context
      attach(child, node)
      
      if (shouldTraverse?.(child, raw) ?? true) // raw = check metadata without storing it
        queue.push(child)
    }
  }
  return root
}
