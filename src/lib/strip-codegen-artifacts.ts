// Matches each `/// <reference .../>` line wherever it appears - valid
// triple-slash directives only ever occur at a file's head, so this never
// touches a real `///` inside actual code.
const REFERENCE_DIRECTIVE = /^\/\/\/.*\r?\n/gm

// Matches a `// __PEN_STRIP_START__` ... `// __PEN_STRIP_END__` block.
// Covers authoring-only code a bundler's own transform won't erase on its
// own (e.g. a template written to disk as-is, never compiled) - unlike a
// `declare`, which any real TS-to-JS compile already strips for free.
const STRIP_BLOCK = /\/\/ __PEN_STRIP_START__[\s\S]*?\/\/ __PEN_STRIP_END__\r?\n?/g

/** Strips authoring-only content from a codegen template: `/// <reference
 *  .../>` directives, and anything wrapped in a `// __PEN_STRIP_START__` /
 *  `// __PEN_STRIP_END__` block. Both exist for the template's own
 *  editor/lint tooling and shouldn't appear in the generated output.
 *
 *  @param source - Template source.
 *  @returns `source` with that content removed, and the blank line usually
 *    left behind at its head trimmed too. */
export function stripCodegenArtifacts(source: string): string {
  return source
    .replace(REFERENCE_DIRECTIVE, '')
    .replace(STRIP_BLOCK, '')
    .trimStart()
}
