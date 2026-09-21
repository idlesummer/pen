import type { Diagnostic } from '../compiler'
import type { Match } from './matcher'
import { compile } from '../compiler'
import { match } from './matcher'

export type Matcher =
  (url: string) => Match

export type Router = {
  matcher: Matcher
  modulePaths: string[] // for the generated component map
  diagnostics: Diagnostic[]
}

/** Creates a router from route file paths: a matcher, diagnostics, and every
 *  module path the compiled tree can render. */
export function createRouter(filePaths: string[]): Router {
  const { positionTree, modulePaths, diagnostics } = compile(filePaths)
  const matcher: Matcher = (url) => match(positionTree, url)
  return { matcher, modulePaths, diagnostics }
}
