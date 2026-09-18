import type { CompileDiagnostic } from '@/router/compiling/compile-diagnostic'
import type { PositionNode } from '../compiler/position-node'
import type { MatchNode } from './match-tree'
import { compile } from '../compiler'
import { match } from './match-tree'
import { normalizeUrl } from './url-path'

export type { MatchNode, ParamTable } from './match-tree'

export type Matcher =
  (url: string) => MatchNode

/** Given a compiled position tree, returns a matcher for that tree - the
 *  runtime half, no filesystem/compile-time dependency at all. */
export function createMatcher(positionTree: PositionNode): Matcher {
  return url => match(positionTree, normalizeUrl(url))
}

export type Router = {
  matcher: Matcher
  modulePaths: string[] // for the generated component map
  diagnostics: CompileDiagnostic[]
}

/** Creates a router from route file paths: a matcher, diagnostics, and every
 *  module path the compiled tree can render. */
export function createRouter(filePaths: string[]): Router {
  const { positionTree, modulePaths, diagnostics } = compile(filePaths)
  const matcher = createMatcher(positionTree)
  return { matcher, modulePaths, diagnostics }
}
