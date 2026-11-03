/** Creates a pattern matching `// #region <name>` blocks. */
function createRegionPattern(name: string) {
  return new RegExp(`// #region ${name}\\b[\\s\\S]*?// #endregion[^\\n]*\\n?`, 'g')
}

/** Removes one named authoring-only region from a codegen template. Chain
 *  calls to strip more than one region.
 *
 *  @param source - Template source.
 *  @param name - Region name, as written after `// #region`.
 *  @returns The template without that region or leading whitespace. */
export function stripRegion(source: string, name: string): string {
  return source.replace(createRegionPattern(name), '').trimStart()
}

/** Substitutes template tokens with their corresponding values.
 *  @param template - Template source.
 *  @param substitutions - Token-value pairs to substitute.
 *  @returns The template with all matching tokens replaced.
 */
export function substituteTemplate(template: string, substitutions: Record<string, string>): string {
  for (const [token, value] of Object.entries(substitutions))
    template = template.replaceAll(token, () => value)
  return template
}
