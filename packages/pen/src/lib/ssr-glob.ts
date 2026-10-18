import type { ViteDevServer } from 'vite'
import { globSync } from 'node:fs'
import { join } from 'node:path'
import { createServer, normalizePath } from 'vite'

/**
 * Imports every route module through Vite's transform pipeline.
 *
 * @param projectDir - Absolute path to the project directory.
 * @param routesDir - App route directory relative to the project root.
 * @param server - An existing dev server to reuse, if one is already
 *  running. Otherwise a throwaway one is created and closed for this call
 *  alone - the only option when there's no dev server, as during `pen build`.
 * @returns Sorted route file paths paired with their imported module values.
 */
export async function ssrGlob<T>(projectDir: string, routesDir: string, server?: ViteDevServer): Promise<Array<[string, T]>> {
  const activeServer = server ?? await createServer({
    root: projectDir,
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true },
  })
  try {
    const paths = globSync('**/*.tsx', { cwd: join(projectDir, routesDir) }).map(normalizePath).sort()
    const modules = paths.map(async path => [path, await activeServer.ssrLoadModule(`/${routesDir}/${path}`)] as [string, T])
    return await Promise.all(modules)
  }
  finally {
    if (!server) await activeServer.close()  // only close servers created for this call
  }
}
