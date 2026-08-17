import type { SearchNode } from '../compiler/search-tree'
import type { RenderNode } from './render-tree'
import { createRenderTree } from './render-tree'

export type Matcher =
  (url: string) => [hasPage: boolean, tree?: RenderNode]

/** Given a compiled SearchNode tree, returns a matcher for that tree -
 *  the runtime half, no filesystem/compile-time dependency at all. */
export function createMatcher(searchTree: SearchNode): (url: string) => [hasPage: boolean, tree?: RenderNode] {
  return (url) => createRenderTree(url, searchTree)
}
