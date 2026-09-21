export type Diagnostic = {
  rule: string
  severity: 'error' | 'warning'
  message: string
  files: string[]
}

export type FormattedDiagnostic = {
  severity: Diagnostic['severity']
  text: string
}

/** Formats each diagnostic into display-ready text, one block per
 *  diagnostic plus its files. Pure - callers decide where the text goes. */
export function formatDiagnostics(diagnostics: Diagnostic[]): FormattedDiagnostic[] {
  return diagnostics.map(({ severity, rule, message, files }) => ({
    severity,
    text: [`[${severity}] ${rule}: ${message}`, ...files.map(file => `  at ${file}`)].join('\n'),
  }))
}
