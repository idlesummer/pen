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
 * Builds a tree in place from filesystem paths.
 *
 * - Each path is traversed from parent to child.
 * - Shared path prefixes reuse the same nodes.
 * - Nodes are created and attached in a single top-down pass.
 * - The order of the input paths does not matter.
 * - Returning `undefined` from `create` prunes the remainder of that path.
 * - `root` is mutated through `attach` and is not replaced.
 *
 * Paths are expected to use the current platform's path separator.
 *
 * @param root - The node paths are attached to. Mutated through `attach`, never replaced.
 * @param sourcePaths - The filesystem paths to build into the tree.
 * @param hooks - Callbacks controlling node creation and attachment; see {@link TreeifyHooks}.
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
 * treeify(root, ['src/index.ts', 'src/lib/utils.ts'], {
 *   create: (parent, { part }) => ({
 *     name: part,
 *     parent,
 *     children: [],
 *   }),
 *   attach: (child, parent) =>
 *     parent.children.push(child),
 * })
 * ```
 */
export function treeify<TNode>(root: TNode, paths: string[], separator='/', hooks: TreeifyHooks<TNode>) {
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
