import type { ElementTree } from '@/core/route-builder'

/**
 * Serializes an ElementTree to React.createElement() code string.
 *
 * Recursively converts the tree structure into nested createElement calls
 * with proper indentation for readability in the generated code.
 *
 * @param tree - The element tree to serialize
 * @param indent - Current indentation level (default: 0)
 * @returns JavaScript code string representing createElement calls
 *
 * @example
 * const tree = {
 *   component: 'Component0',
 *   props: { path: '"/home"' },
 *   children: {
 *     component: 'Component1',
 *     props: { outlet: 'true' }
 *   }
 * }
 * serialize(tree)
 * // Returns:
 * // createElement(Component0, { path: "/home" },
 * //   createElement(Component1, { outlet: true })
 * // )
 */
export function serialize(tree: ElementTree, indent = 0): string {
  const spaces = '  '.repeat(indent)

  // Props are already pre-serialized (strings have quotes, identifiers don't)
  const props = Object.entries(tree.props)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ')

  if (tree.children) {
    const childCode = serialize(tree.children, indent + 1)
    return `createElement(${tree.component}, { ${props} },\n${spaces}  ${childCode}\n${spaces})`
  }

  return `createElement(${tree.component}, { ${props} })`
}
