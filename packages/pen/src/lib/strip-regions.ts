// Matches authoring-only blocks marked `// #region <name>`.
// Using editor regions enables folding in supported editors.
const regionPattern = (name: string) => new RegExp(`// #region ${name}\\b[\\s\\S]*?// #endregion[^\\n]*\\n?`, 'g')

/** Removes one named authoring-only region from a codegen template. Chain
 *  calls to strip more than one region.
 *
 *  @param source - Template source.
 *  @param name - Region name, as written after `// #region`.
 *  @returns The template without that region or leading whitespace. */
export function stripRegion(source: string, name: string): string {
  return source.replace(regionPattern(name), '').trimStart()
}
