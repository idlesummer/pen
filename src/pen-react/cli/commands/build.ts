import { defineCommand } from 'citty'
import { formatDiagnostics } from '@/pen-core'
import { buildApp } from '@/pen-react/build'

export const buildCommand = defineCommand({
  meta: {
    name: 'build',
    description: 'Compile routes and bundle the app with Vite',
  },
  run: async () => {
    const BUILD_APP_DIR = 'src/app'
    const BUILD_OUT_DIR = '.pen/dist'
    const diagnostics = await buildApp(BUILD_APP_DIR, BUILD_OUT_DIR)

    for (const { severity, text } of formatDiagnostics(diagnostics))
      console[severity](text)

    if (diagnostics.some(diagnostic => diagnostic.severity === 'error'))
      throw new Error('Build failed')
  },
})
