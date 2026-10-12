export type Diagnostic = {
  rule: string
  // Named to match the console method it's meant to be dispatched to
  // (console[severity](message)), not English ('warning').
  severity: 'error' | 'warn'
  description: string
  files: string[]
  message: string
}

/** Builds a diagnostic, formatting its display-ready message up front - one
 *  line for the rule and description, plus one line per file. */
export function createDiagnostic(diagnostic: Omit<Diagnostic, 'message'>): Diagnostic {
  const { rule, severity, description, files } = diagnostic
  const message = [`[${severity}] ${rule}: ${description}`, ...files.map(file => `  at ${file}`)].join('\n')
  return { ...diagnostic, message }
}
