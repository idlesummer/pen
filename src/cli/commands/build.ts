import { defineCommand } from 'citty'
import { reportDiagnostics } from '@/router'
import { build } from '@/react/build'

/** @deprecated Only ever exists to drive @/react/build's build(), which is
 *  itself deprecated - needs a rewrite once the new pipeline has a build step. */
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
