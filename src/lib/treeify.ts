import { join, sep } from 'node:path'

export type CreateHookContext = {
  /** The current path component being processed. */
  component: string
  /** All path components of the current input path. */
  components: readonly string[]
  /** The full input path currently being processed. */
  sourcePath: string
  /** The zero-based position of the current segment within the input path. */
  index: number
}

export type TreeifyHooks<TNode> = {
  /** Builds a node for a path segment. Return `undefined` to prune the remainder of the current path. */
  create: (parent: TNode, context: CreateHookContext) => TNode | undefined
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
 *   create: (parent, { component }) => ({
 *     name: component,
 *     parent,
 *     children: [],
 *   }),
 *   attach: (child, parent) =>
 *     parent.children.push(child),
 * })
 * ```
 */
export function treeify<TNode>(root: TNode, sourcePaths: string[], hooks: TreeifyHooks<TNode>) {
  const { create, attach } = hooks
  const nodes = new Map<string, TNode>()

  for (const sourcePath of sourcePaths) {
    const components = sourcePath.split(sep)
    let parentPath = ''
    let parentNode = root

    for (const [index, component] of components.entries()) {
      const path = join(parentPath, component)
      let node = nodes.get(path)

      if (node === undefined) {
        node = create(parentNode, { component, components, sourcePath, index })
        if (node === undefined)
          break

        nodes.set(path, node)
        attach(node, parentNode)
      }
      parentNode = node
      parentPath = path
    }
  }
}
