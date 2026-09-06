import type { TrieNode } from './compiling/route-trie'
import type { RenderPlan } from './matching/render-plan'
import { createRenderPlan } from './matching/render-plan'
import { normalizeUrl } from './matching/url-path'

export type Matcher =
  (url: string) => RenderPlan

/** Given a compiled URL trie, returns a matcher for it - the runtime half,
 *  with no filesystem or compile-time dependency at all. */
export function createMatcher(routeTrie: TrieNode): Matcher {
  return (url) => createRenderPlan(normalizeUrl(url), routeTrie)
}
