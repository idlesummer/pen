import type { ViteDevServer } from 'vite'
import { globSync } from 'node:fs'
import { join } from 'node:path'
import { normalizePath } from 'vite'

/**
 * Imports every module matching a glob pattern through Vite's transform pipeline.
 *
 * @param projectDir - Absolute path to the project directory.
 * @param routesDir - App route directory relative to the project root.
 * @param pattern - Glob pattern matched within the routes directory.
 * @param server - The dev server to load modules through.
 * @returns Imported module values keyed by their sorted route file paths.
 */
export async function ssrGlob<T>(projectDir: string, routesDir: string, pattern: string, server: ViteDevServer): Promise<Record<string, T>> {
  const paths = globSync(pattern, { cwd: join(projectDir, routesDir) }).map(normalizePath).sort()
  const modules = paths.map(async path => [path, await server.ssrLoadModule(`/${routesDir}/${path}`)] as [string, T])
  const entries = await Promise.all(modules)
  return Object.fromEntries(entries)
}
