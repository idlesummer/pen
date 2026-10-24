import type { ViteDevServer } from 'vite'
import { globSync } from 'node:fs'
import { join } from 'node:path'
import { normalizePath } from 'vite'

export type SsrGlobOptions = {
  /** Directory the pattern is resolved within, relative to the server root - same role as `import.meta.glob`'s own `base` option. */
  base: string
  /** The dev server to load modules through. */
  server: ViteDevServer
}

/**
 * Imports every module matching a glob pattern through Vite's transform
 * pipeline - a runtime counterpart to `import.meta.glob`, taking the same
 * pattern-plus-`base` shape.
 *
 * @param pattern - Glob pattern matched within `options.base`.
 * @param options - See {@link SsrGlobOptions}.
 * @returns Imported module values keyed by their sorted file paths.
 */
export async function ssrGlob<T>(pattern: string, { base, server }: SsrGlobOptions): Promise<Record<string, T>> {
  const paths = globSync(pattern, { cwd: join(server.config.root, base) }).map(normalizePath).sort()
  const modules = paths.map(async path => [path, await server.ssrLoadModule(`/${base}/${path}`)] as [string, T])
  const entries = await Promise.all(modules)
  return Object.fromEntries(entries)
}
