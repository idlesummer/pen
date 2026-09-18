import type { CompileDiagnostic } from '../compiler'
import type { Match } from './match'
import { compile } from '../compiler'
import { match } from './match'
import { normalizeUrl } from './url-path'

export type Matcher =
  (url: string) => Match

export type Router = {
  matcher: Matcher
  modulePaths: string[] // for the generated component map
  diagnostics: CompileDiagnostic[]
}

/** Creates a router from route file paths: a matcher, diagnostics, and every
 *  module path the compiled tree can render. */
export function createRouter(filePaths: string[]): Router {
  const { positionTree, modulePaths, diagnostics } = compile(filePaths)
  const matcher: Matcher = (url) => match(positionTree, normalizeUrl(url))
  return { matcher, modulePaths, diagnostics }
}
