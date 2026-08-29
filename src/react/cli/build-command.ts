import { defineCommand } from 'citty'
import { reportDiagnostics } from '@/lib/report-diagnostics'
import { build } from '@/react/build'

export const buildCommand = defineCommand({
  meta: {
    name: 'build',
    description: 'Compile routes and generate static entry files for a pen app',
  },
  args: {
    appDir: { type: 'positional', description: 'App directory containing route files', default: 'app' },
    outDir: { type: 'positional', description: 'Output directory for generated files', default: 'dist' },
  },
  run({ args }) {
    const { diagnostics } = build(args.appDir, args.outDir)
    reportDiagnostics(diagnostics)

    if (diagnostics.some(diagnostic => diagnostic.severity === 'error'))
      process.exit(1)
  },
})
