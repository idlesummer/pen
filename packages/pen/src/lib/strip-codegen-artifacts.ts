// Matches authoring-only blocks marked `// #region codegen`.
// Using editor regions enables folding in supported editors.
const STRIP_BLOCK = /\/\/ #region codegen\b[\s\S]*?\/\/ #endregion[^\n]*\n?/g

/** Removes authoring-only blocks from a codegen template.
 *
 *  @param source - Template source.
 *  @returns The template without strip blocks or leading whitespace. */
export function stripCodegenArtifacts(source: string): string {
  return source.replace(STRIP_BLOCK, '').trimStart()
}
