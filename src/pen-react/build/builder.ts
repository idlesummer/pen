import type { Diagnostic } from '@/pen-core'
import type { RouteComponent } from '@/pen-react/runtime'
import { createBuilder, createServer } from 'vite'
import { PACKAGE_NAME } from '@/lib/constants'
import { findFiles } from '@/lib/find-files'
import { compileApp, GLOBAL_DEFAULT, GLOBAL_ERROR } from '@/pen-core'
import { DefaultFallback, ErrorFallback } from '@/pen-react/runtime'
import { entryPlugin, ENTRY_MODULE_ID } from './entry-plugin'
import { validateAsyncPages, validateComponentExports } from './validate'

export const BUILD_ENTRY = 'main.js'

/** Imports every route module for real through Vite's transform pipeline. */
async function loadComponents(appDir: string, filePaths: string[]): Promise<Map<string, RouteComponent | undefined>> {
  // Silent: a transform error here still throws and reaches buildApp's own
  // catch, which reports it through the same Diagnostic path as everything
  // else - Vite's own dev-server logger would otherwise print it a second
  // time, ahead of and separately from that diagnostic.
  const server = await createServer({ configFile: false, logLevel: 'silent', server: { middlewareMode: true } })
  try {
    const components = new Map<string, RouteComponent | undefined>()
    for (const filePath of filePaths) {
      const module = await server.ssrLoadModule(`/${appDir}/${filePath}`) as { default?: RouteComponent }
      components.set(filePath, module.default)
    }
    components.set(GLOBAL_DEFAULT, DefaultFallback)
    components.set(GLOBAL_ERROR, ErrorFallback)
    return components
  }
  finally {
    await server.close()
  }
}

/** Vite/rolldown errors commonly carry the offending file as `.id` - named
 *  when present, since formatDiagnostics can point at it like any other
 *  diagnostic; omitted otherwise rather than guessed. */
function errorFile(error: unknown): string[] {
  return error && typeof error === 'object' && 'id' in error && typeof error.id === 'string'
    ? [error.id]
    : []
}

/** Compiles routes, validates them, then bundles the app with Vite. The
  * bundle discovers routes independently through the entry app. Skips
  * later stages once earlier ones report an error, so a broken app never
  * produces a bundle that would only fail once someone runs it.
  *
  * @param appDir Directory containing the app's route files.
  * @param outDir Directory to write the bundle to.
  * @returns Diagnostics produced while compiling and validating the app. */
export async function buildApp(appDir: string, outDir: string): Promise<Diagnostic[]> {
  try {
    const filePaths = findFiles(appDir, '.tsx')
    const components = await loadComponents(appDir, filePaths)
    const { modulePaths, pageEndpoints, diagnostics } = compileApp(filePaths)

    diagnostics.push(...validateComponentExports(modulePaths, components))
    diagnostics.push(...validateAsyncPages(pageEndpoints, components))
    if (diagnostics.some(diagnostic => diagnostic.severity === 'error'))
      return diagnostics

    const builder = await createBuilder({
      configFile: false,
      plugins: [entryPlugin(appDir)],
      ssr: {  // Bundle pen's runtime instead of leaving it external
        noExternal: [PACKAGE_NAME],
      },
      build: {
        outDir,
        // Build for Node so imports work instead of being treated as browser code
        ssr: true,
        rolldownOptions: {
          // The entry-app template discovers the user's routes for bundling
          input: ENTRY_MODULE_ID,
          // Relative to build.outDir, not a second path to join it onto -
          // entryFileNames: join(outDir, BUILD_ENTRY) here would double it up.
          output: { entryFileNames: BUILD_ENTRY },
        },
      },
    })
    // Vite creates both client and SSR environments, so explicitly build only
    // the server version
    await builder.build(builder.environments.ssr!)
    return diagnostics
  }
  catch (error) {
    // FindFiles and Vite/rolldown throw regular errors, so route them through
    // the same reporting path as the rest of the pipeline.
    return [{
      rule: 'build-failed',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error),
      files: errorFile(error),
    }]
  }
}
