import { globSync } from 'node:fs'
import { join } from 'node:path'
import { createServer, normalizePath } from 'vite'

/**
 * Imports every route module through Vite's transform pipeline.
 *
 * @param projectDir - Absolute path to the project directory.
 * @param routesDir - App route directory relative to the project root.
 * @returns Sorted route file paths paired with their imported module values.
 */
export async function ssrGlob<T>(projectDir: string, routesDir: string): Promise<Array<[string, T]>> {
  const server = await createServer({
    root: projectDir,
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true },
  })
  try {
    const paths = globSync('**/*.tsx', { cwd: join(projectDir, routesDir) }).map(normalizePath).sort()
    const modules = paths.map(async path => [path, await server.ssrLoadModule(`/${routesDir}/${path}`)] as [string, T])
    return await Promise.all(modules)
  }
  finally {
    await server.close()
  }
}
