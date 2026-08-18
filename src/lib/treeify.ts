export type CreateContext = {
  /** The zero-based position of the current segment within the input path. */
  index: number
  /** All path parts of the current input path. */
  parts: readonly string[]
  /** The full input path currently being processed. */
  path: string
}

export type TreeifyHooks<TNode> = {
  /** Builds a node for a path segment. Return `undefined` to prune the remainder of the current path. */
  create: (parent: TNode, context: CreateContext) => TNode | undefined
  /** Attaches a child node to its parent. */
  attach: (child: TNode, parent: TNode) => void
}

/**
 * Builds a tree in place from paths.
 *
 * Each path is traversed from parent to child, reusing nodes for shared
 * prefixes. Nodes are created and attached as they are encountered.
 *
 * Returning `undefined` from `create` stops processing the current path.
 *
 * @param root - The root node of the tree. Mutated through `attach`.
 * @param paths - The paths to build into the tree.
 * @param separator - The separator used to split each path.
 * @param hooks - Callbacks used to create and attach nodes.
 *
 * @example
 * ```ts
 * type Node = {
 *   name: string
 *   parent?: Node
 *   children: Node[]
 * }
 *
 * const root: Node = { name: '', children: [] }
 *
 * treeify(root, ['src/index.ts', 'src/lib/utils.ts'], '/', {
 *   create: (parent, { index, parts }) => ({
 *     name: parts[index]!, // defined because index comes from parts.entries()
 *     parent,
 *     children: [],
 *   }),
 *   attach: (child, parent) =>
 *     parent.children.push(child),
 * })
 * ```
 */
export function treeify<TNode>(root: TNode, paths: string[], separator: string, hooks: TreeifyHooks<TNode>) {
  const { create, attach } = hooks
  const siblingNodeMap = new Map<TNode, Map<string, TNode>>() // map: node  edge (part) → node
  const createSiblingNodes = () => new Map<string, TNode>()

  for (const path of paths) {
    const parts = path.split(separator)
    let parentNode = root

    // Iterates each segment in the path ('foo/bar/baz' → ['foo', 'bar', 'baz'])
    for (const [index, part] of parts.entries()) {
      const siblingNodes = siblingNodeMap.getOrInsertComputed(parentNode, createSiblingNodes)
      let node = siblingNodes.get(part)

      if (node === undefined) {
        const context = { index, parts, path }
        node = create(parentNode, context)
        if (node === undefined)
          break

        siblingNodes.set(part, node)
        attach(node, parentNode)
      }
      parentNode = node
    }
  }
}
