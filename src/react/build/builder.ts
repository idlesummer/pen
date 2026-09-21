import type { Diagnostic } from '@/router'
import { fileURLToPath } from 'node:url'
import { createBuilder } from 'vite'
import { PACKAGE_NAME } from '@/lib/constants'
import { findFiles } from '@/lib/find-files'
import { compileApp } from '@/router'

// Resolves next to this module both from source (src/react/build/) and once
// bundled (tsdown copies entry-app.tsx flat into dist/, alongside bin.mjs),
// so import.meta.url always has the right sibling.
const ENTRY_APP = fileURLToPath(new URL('./entry-app.tsx', import.meta.url))

/**
  * Compiles routes for diagnostics, then bundles the app with Vite.
  * The bundle discovers routes independently through the entry app.
  * Skips the Vite build when compilation has errors.
  *
  * @param appDir Directory containing the app's route files.
  * @param outDir Directory where the built app is written.
  * @returns Diagnostics produced while compiling the app.
  */
export async function buildApp(appDir: string, outDir: string): Promise<Diagnostic[]> {
  const filePaths = findFiles(appDir, '.tsx')
  const diagnostics = compileApp(filePaths).diagnostics
  if (diagnostics.some(diagnostic => diagnostic.severity === 'error'))
    return diagnostics

  const builder = await createBuilder({
    configFile: false,
    // Bundle pen's runtime instead of leaving it external
    ssr: {
      noExternal: [PACKAGE_NAME],
    },
    build: {
      outDir,
      // Build for Node so imports work instead of being treated as browser code
      ssr: true,
      rolldownOptions: {
        input: ENTRY_APP,
        output: { entryFileNames: 'entry.js' },
      },
    },
  })
  // Vite creates both client and SSR environments, so explicitly build only
  // the server version.
  await builder.build(builder.environments.ssr!)
  return diagnostics
}
