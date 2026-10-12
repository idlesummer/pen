// Matches a `// #region strip` ... `// #endregion` block - the "strip"
// label disambiguates it from an ordinary folding region nobody wants
// removed. Reusing #region/#endregion (over a custom marker) means
// editors that support region folding (e.g. VS Code) collapse these
// for free while authoring the template.
const STRIP_BLOCK = /\/\/ #region strip.*\r?\n[\s\S]*?\/\/ #endregion.*\r?\n?/g

/** Strips `// #region strip` / `// #endregion` blocks from a codegen
 *  template: authoring-only content (triple-slash directives, declares)
 *  its own editor/lint tooling needs but that shouldn't appear in the
 *  generated output.
 *
 *  @param source - Template source.
 *  @returns `source` with every such block removed, and the blank line
 *    usually left behind at its head trimmed too. */
export function stripCodegenArtifacts(source: string): string {
  return source.replace(STRIP_BLOCK, '').trimStart()
}
