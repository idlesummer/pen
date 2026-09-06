import type { SearchNode } from './compiling/search-tree'
import type { RenderPlan } from './matching/render-plan'
import { createRenderPlan } from './matching/render-plan'
import { normalizeUrl } from './matching/url-path'

export type Matcher =
  (url: string) => RenderPlan

/** Given a compiled search tree, returns a matcher for it - the runtime half,
 *  with no filesystem or compile-time dependency at all. */
export function createMatcher(searchTree: SearchNode): Matcher {
  return (url) => createRenderPlan(normalizeUrl(url), searchTree)
}
