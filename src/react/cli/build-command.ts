import { defineCommand } from 'citty'
import { reportDiagnostics } from '@/lib/report-diagnostics'
import { build } from '@/react/build'

export const buildCommand = defineCommand({
  meta: {
    name: 'build',
    description: 'Compile routes and generate static entry files for a pen app',
  },
  run() {
    const { diagnostics } = build('app', 'dist')
    reportDiagnostics(diagnostics)

    if (diagnostics.some(diagnostic => diagnostic.severity === 'error'))
      process.exit(1)
  },
})
