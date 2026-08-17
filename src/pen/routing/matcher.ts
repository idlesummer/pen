import type { SearchNode } from './compiling/search-tree'
import type { RenderNode } from './matching/render-tree'
import { createRenderTree } from './matching/render-tree'

export type Matcher =
  (url: string) => [hasPage: boolean, tree?: RenderNode]

/** Given a compiled SearchNode tree, returns a matcher for that tree -
 *  the runtime half, no filesystem/compile-time dependency at all. */
export function createMatcher(searchTree: SearchNode): (url: string) => [hasPage: boolean, tree?: RenderNode] {
  return (url) => createRenderTree(url, searchTree)
}
