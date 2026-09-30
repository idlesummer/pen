export type Diagnostic = {
  rule: string
  // Named to match the console method it's meant to be dispatched to
  // (console[severity](text)), not English ('warning').
  severity: 'error' | 'warn'
  message: string
  files: string[]
  text: string
}

/** Builds a diagnostic, formatting its display-ready text up front - one
 *  line for the rule and message, plus one line per file. */
export function createDiagnostic(rule: string, severity: Diagnostic['severity'], message: string, files: string[]): Diagnostic {
  const text = [`[${severity}] ${rule}: ${message}`, ...files.map(file => `  at ${file}`)].join('\n')
  return { rule, severity, message, files, text }
}
