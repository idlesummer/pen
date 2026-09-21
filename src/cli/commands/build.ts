import { defineCommand } from 'citty'
import { formatDiagnostics } from '@/router'
import { buildApp, BUILD_OUT_DIR } from '@/react/build'

export const buildCommand = defineCommand({
  meta: {
    name: 'build',
    description: 'Compile routes and bundle the app with Vite',
  },
  run: async () => {
    const diagnostics = await buildApp('src/app', BUILD_OUT_DIR)
    for (const { severity, text } of formatDiagnostics(diagnostics))
      console[severity](text)

    if (diagnostics.some(diagnostic => diagnostic.severity === 'error'))
      throw new Error('Build failed')
  },
})
