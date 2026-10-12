// Matches a `// __PEN_STRIP_START__` ... `// __PEN_STRIP_END__` block -
// every template gathers its triple-slash directives, declares, and any
// other authoring-only content into one of these, usually at its head.
const STRIP_BLOCK = /\/\/ __PEN_STRIP_START__[\s\S]*?\/\/ __PEN_STRIP_END__\r?\n?/g

/** Strips `// __PEN_STRIP_START__` / `// __PEN_STRIP_END__` blocks from a
 *  codegen template: authoring-only content (triple-slash directives,
 *  declares) its own editor/lint tooling needs but that shouldn't appear
 *  in the generated output.
 *
 *  @param source - Template source.
 *  @returns `source` with every such block removed, and the blank line
 *    usually left behind at its head trimmed too. */
export function stripCodegenArtifacts(source: string): string {
  return source.replace(STRIP_BLOCK, '').trimStart()
}
