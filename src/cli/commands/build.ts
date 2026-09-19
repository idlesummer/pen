import { defineCommand } from 'citty'
import { reportDiagnostics } from '@/router'
import { build } from '@/react/build'

export const buildCommand = defineCommand({
  meta: {
    name: 'build',
    description: 'Compile routes and generate static entry files for a pen app',
  },
  run: () => {
    const diagnostics = build('app', '.pen/generated')
    reportDiagnostics(diagnostics)

    if (diagnostics.some(diagnostic => diagnostic.severity === 'error'))
      throw new Error('Build failed')
  },
})
