import { globSync } from 'node:fs'
import { join } from 'node:path'
import { createServer, normalizePath } from 'vite'
import { ROUTES_DIR } from './constants'

/**
 * Imports every route module through Vite's transform pipeline.
 *
 * @param projectDir - Absolute path to the project directory.
 * @returns Sorted route file paths paired with their imported module values.
 */
export async function ssrGlob<T>(projectDir: string): Promise<Array<[string, T]>> {
  const server = await createServer({
    root: projectDir,
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true },
  })
  try {
    const paths = globSync('**/*.tsx', { cwd: join(projectDir, ROUTES_DIR) }).map(normalizePath).sort()
    const modules = paths.map(async path => [path, await server.ssrLoadModule(`/${ROUTES_DIR}/${path}`)] as [string, T])
    return await Promise.all(modules)
  }
  finally {
    await server.close()
  }
}
