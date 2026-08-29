import type { CompileDiagnostic } from '@/router'

/** Prints compile diagnostics to the console, one line per diagnostic plus its files. */
export function reportDiagnostics(diagnostics: CompileDiagnostic[]): void {
  for (const { severity, rule, message, files } of diagnostics) {
    const log = severity === 'error' ? console.error : console.warn
    log(`[${severity}] ${rule}: ${message}`)
    for (const file of files) log(`  at ${file}`)
  }
}
