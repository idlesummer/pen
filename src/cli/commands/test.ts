import { defineCommand } from 'citty'
import { formatDiagnostics } from '@/router'
import { legacyBuild } from '@/react/build'

export const testCommand = defineCommand({
  meta: {
    name: 'test',
    description: 'Compile routes and generate static entry files (legacy codegen pipeline, kept for comparison while build/start move to Vite)',
  },
  run: () => {
    const diagnostics = legacyBuild('app', '.pen/generated')
    for (const { severity, text } of formatDiagnostics(diagnostics))
      console[severity](text)

    if (diagnostics.some(diagnostic => diagnostic.severity === 'error'))
      throw new Error('Build failed')
  },
})
