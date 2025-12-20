export type TraversalOptions<T> = {
  root: T
  children: (node: T) => T[]
  visit?:   (node: T) => void     // BFS visit / DFS preorder
  exit?:    (node: T) => void     // DFS postorder (ignored by BFS)
  prune?:   (node: T) => boolean  // skip expanding this node
  pruneChild?: (child: T, parent: T) => boolean // skip this child edge
}

export function bfs<T>(options: TraversalOptions<T>) {
  const { root, children, visit, pruneChild, prune } = options
  const queue = [root]

  // for-of over a growing queue implements FIFO
  for (const node of queue) {
    visit?.(node)
    if (prune?.(node)) continue

    for (const child of children(node)) {
      if (pruneChild?.(child, node)) continue
      queue.push(child)
    }
  }
}

type Frame<T> = {
  node: T
  entering: boolean  // true = preorder, false = postorder
}

export function dfs<T>(options: TraversalOptions<T>) {
  const { root, children, visit, exit, prune, pruneChild } = options
  const stack: Frame<T>[] = [{ node: root, entering: true }]

  while (stack.length) {
    const frame = stack.pop()!
    const node = frame.node
    if (!frame.entering) {
      exit?.(node)
      continue
    }

    visit?.(node)         // preorder
    if (prune?.(node)) {  // skip children but still exit
      exit?.(node)
      continue
    }

    stack.push({ node, entering: false })
    const nodes = children(node)

    // push children in reverse to match recursive DFS order
    for (let i = nodes.length-1; i >= 0; i--) {
      const child = nodes[i]
      if (pruneChild?.(child, node)) continue
      stack.push({ node: child, entering: true })
    }
  }
}
