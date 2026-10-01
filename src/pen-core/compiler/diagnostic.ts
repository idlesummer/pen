export type Diagnostic = {
  rule: string
  // Named to match the console method it's meant to be dispatched to
  // (console[severity](message)), not English ('warning').
  severity: 'error' | 'warn'
  description: string
  files: string[]
  message: string
}

/**
 * Builds a diagnostic with display-ready message.
 *
 * @param rule - The validation rule that produced the diagnostic.
 * @param severity - The console severity to use when reporting it.
 * @param description - The diagnostic description.
 * @param files - The files associated with the diagnostic.
 * @returns A diagnostic containing its structured data and formatted message.
 */
export function createDiagnostic(rule: string, severity: Diagnostic['severity'], description: string, files: string[]): Diagnostic {
  const message = `[${severity}] ${rule}: ${description}\n${files.map(file => `\n  at ${file}`).join('')}`
  return { rule, severity, description, files, message }
}
