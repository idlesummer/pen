export type CompileDiagnostic = {
  rule: string
  severity: 'error' | 'warning'
  message: string
  files: string[]
}
