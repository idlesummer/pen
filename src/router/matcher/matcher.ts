import type { PositionNode } from '../compiler/position-node'
import type { Match } from './match-tree'
import { match } from './match-tree'
import { normalizeUrl } from './url-path'

export type Matcher =
  (url: string) => Match

/** Given a compiled position tree, returns a matcher for that tree - the
 *  runtime half, no filesystem/compile-time dependency at all. */
export function createMatcher(positionTree: PositionNode): Matcher {
  return (url) => match(positionTree, normalizeUrl(url))
}
