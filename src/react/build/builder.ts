import type { Diagnostic } from '@/router'
import { join } from 'node:path'
import { createBuilder } from 'vite'
import { PACKAGE_NAME } from '@/lib/constants'
import { findFiles } from '@/lib/find-files'
import { compileApp } from '@/router'

// Build output location - starter.ts needs to find the same file this writes.
export const BUILD_OUT_DIR = '.pen/dist'
const BUILD_ENTRY_FILE = 'main.js'
export const BUILD_ENTRY = join(BUILD_OUT_DIR, BUILD_ENTRY_FILE)

/**
  * Compiles routes for diagnostics, then bundles the app with Vite.
  * The bundle discovers routes independently through the entry app.
  * Skips the Vite build when compilation has errors.
  *
  * @param appDir Directory containing the app's route files.
  * @returns Diagnostics produced while compiling the app.
  */
export async function buildApp(appDir: string): Promise<Diagnostic[]> {
  const filePaths = findFiles(appDir, '.tsx')
  const diagnostics = compileApp(filePaths).diagnostics
  if (diagnostics.some(diagnostic => diagnostic.severity === 'error'))
    return diagnostics

  const builder = await createBuilder({
    configFile: false,
    ssr: {  // Bundle pen's runtime instead of leaving it external
      noExternal: [PACKAGE_NAME],
    },
    build: {
      outDir: BUILD_OUT_DIR,
      // Build for Node so imports work instead of being treated as browser code
      ssr: true,
      rolldownOptions: {
        // The entry-app discovers the user's routes for bundling
        input: join(import.meta.dirname, 'entry-app.tsx'),
        output: { entryFileNames: BUILD_ENTRY_FILE },
      },
    },
  })
  // Vite creates both client and SSR environments, so explicitly build only
  // the server version
  await builder.build(builder.environments.ssr!)
  return diagnostics
}
