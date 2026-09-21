import { defineCommand } from 'citty'
import { reportDiagnostics } from '@/router'
import { build } from '@/react/build'

export const buildCommand = defineCommand({
  meta: {
    name: 'build',
    description: 'Compile routes and bundle the app with Vite',
  },
  run: async () => {
    const diagnostics = await build('app', '.pen/dist')
    reportDiagnostics(diagnostics)

    if (diagnostics.some(diagnostic => diagnostic.severity === 'error'))
      throw new Error('Build failed')
  },
})
