import { defineBuildCommand } from '@/cli/commands/build'
import { reportDiagnostics } from '@/lib/report-diagnostics'
import { build } from '@/react/build'

export const buildCommand = defineBuildCommand(() => {
  const { diagnostics } = build('app', 'dist')
  reportDiagnostics(diagnostics)

  if (diagnostics.some(diagnostic => diagnostic.severity === 'error'))
    process.exit(1)
})
