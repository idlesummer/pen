import type { CompileDiagnostic } from '../compiler'
import type { Match } from './matcher'
import { compile } from '../compiler'
import { match } from './matcher'

export type Matcher =
  (url: string) => Match

export type Router = {
  matcher: Matcher
  modulePaths: string[] // for the generated component map
  diagnostics: CompileDiagnostic[]
}

/** Splits a URL into segments for matching: drops every empty piece, so a
 *  leading slash, a trailing slash, and repeated slashes all collapse away
 *  on their own. The root URL becomes `[]` - no leading blank segment,
 *  matching `PositionNode.urlDepth`, which indexes straight into this array
 *  with no offset. */
function normalizeUrl(urlString: string): string[] {
  return urlString.split('/').filter(Boolean)
}

/** Creates a router from route file paths: a matcher, diagnostics, and every
 *  module path the compiled tree can render. */
export function createRouter(filePaths: string[]): Router {
  const { positionTree, modulePaths, diagnostics } = compile(filePaths)
  const matcher: Matcher = (url) => match(positionTree, normalizeUrl(url))
  return { matcher, modulePaths, diagnostics }
}
