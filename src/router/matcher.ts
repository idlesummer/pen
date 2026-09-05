import type { SearchNode } from './compiling/search-tree.new'
import type { RenderNode } from './matching/render-tree.new'
import { createRenderTree } from './matching/render-tree.new'
import { normalizeUrl } from './matching/url-path'

export type Matcher =
  (url: string) => RenderNode

/** Given a compiled SearchNode tree, returns a matcher for that tree -
 *  the runtime half, no filesystem/compile-time dependency at all. */
export function createMatcher(searchTree: SearchNode): Matcher {
  return (url) => createRenderTree(normalizeUrl(url), searchTree)
}
