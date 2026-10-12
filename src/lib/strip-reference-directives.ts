// Matches each `/// <reference .../>` line wherever it appears - valid
// triple-slash directives only ever occur at a file's head, so this never
// touches a real `///` inside actual code.
const REFERENCE_DIRECTIVE = /^\/\/\/.*\r?\n/gm

/** Strips `/// <reference .../>` directives a codegen template needs for its
 *  own editor/lint tooling but that shouldn't appear in the generated output.
 *
 *  @param source - Template source.
 *  @returns `source` with every triple-slash directive line removed, and
 *    the blank line usually left behind at its head trimmed too. */
export function stripReferenceDirectives(source: string): string {
  return source.replace(REFERENCE_DIRECTIVE, '').trimStart()
}
