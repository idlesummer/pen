import type { Diagnostic, Endpoint } from '@/router'
import type { RouteComponent } from '@/react'
import { join } from 'node:path'
import { createBuilder, createServer } from 'vite'
import { PACKAGE_NAME } from '@/lib/constants'
import { findFiles } from '@/lib/find-files'
import { compileApp, GLOBAL_DEFAULT, GLOBAL_ERROR } from '@/router'
import { DefaultFallback, ErrorFallback, validateModules } from '@/react'

// Build output location - starter.ts needs to find the same file this writes.
export const BUILD_OUT_DIR = '.pen/dist'
const BUILD_ENTRY_FILE = 'main.js'
export const BUILD_ENTRY = join(BUILD_OUT_DIR, BUILD_ENTRY_FILE)

/**
  * Compiles routes, validates them, then bundles the app with Vite. The
  * bundle discovers routes independently through the entry app. Skips
  * later stages once earlier ones report an error, so a broken app never
  * produces a bundle that would only fail once someone runs it.
  *
  * @param appDir Directory containing the app's route files.
  * @returns Diagnostics produced while compiling and validating the app.
  */
export async function buildApp(appDir: string): Promise<Diagnostic[]> {
  const filePaths = findFiles(appDir, '.tsx')
  const { modulePaths, pageEndpoints, diagnostics } = compileApp(filePaths)
  diagnostics.push(...await validateModuleExports(appDir, filePaths, modulePaths, pageEndpoints))
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

/** Imports every route module for real through Vite's transform pipeline -
 *  the only way to know facts like "is this page async", which exist only
 *  on the executed function, never on its file path. A transient dev server
 *  in middleware mode does the importing; nothing here is served over HTTP,
 *  and it's closed before this returns. Keeps entry-app.tsx itself free of
 *  validation - by the time it runs, the app already passed this. */
async function validateModuleExports(appDir: string, filePaths: string[], modulePaths: string[], pageEndpoints: Endpoint[]): Promise<Diagnostic[]> {
  const server = await createServer({ configFile: false, server: { middlewareMode: true } })

  try {
    const componentsByPath = new Map<string, RouteComponent>()
    for (const filePath of filePaths) {
      const module = await server.ssrLoadModule(`/${appDir}/${filePath}`) as { default: RouteComponent }
      componentsByPath.set(filePath, module.default)
    }
    componentsByPath.set(GLOBAL_DEFAULT, DefaultFallback)
    componentsByPath.set(GLOBAL_ERROR, ErrorFallback)
    return validateModules(pageEndpoints, modulePaths, componentsByPath)
  }
  finally {
    await server.close()
  }
}
