export type TreeBuildOptions<TNode, TSource> = {
  root: TNode
  expand:      (node: TNode) => TSource[]                     // Returns source data for node's children
  createChild: (source: TSource, parent: TNode) => TNode      // Transform source data into child nodes
  attach:      (child: TNode, parent: TNode) => void          // Attach child to parent (side effect)
  shouldTraverse?: (child: TNode, source: TSource) => boolean  // Source to check original data w/o storing it in node
}

export function buildTreeBFS<TNode, TSource>(options: TreeBuildOptions<TNode, TSource>): TNode {
  const { root, expand, createChild, attach, shouldTraverse } = options
  const queue = [root]

  for (const node of queue) {
    for (const source of expand(node)) {
      const child = createChild(source, node)      // source = data to transform; node = parent context
      attach(child, node)

      if (shouldTraverse?.(child, source) ?? true) // source = check metadata without storing it
        queue.push(child)
    }
  }
  return root
}

export function buildTreeDFS<TNode, TSource>(options: TreeBuildOptions<TNode, TSource>): TNode {
  const { root, expand, createChild, attach, shouldTraverse } = options
  const stack = [root]

  while (stack.length) {
    const node = stack.pop()!
    const sources = expand(node)
    const len = sources.length

    // Process in reverse to maintain left-to-right order when popping from stack
    for (let i = len-1; i >= 0; i--) {
      const source = sources[i]
      const child = createChild(source, node)
      attach(child, node)

      if (shouldTraverse?.(child, source) ?? true)
        stack.push(child)
    }
  }
  return root
}
