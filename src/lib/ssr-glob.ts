import { globSync } from 'node:fs'
import { join } from 'node:path'
import { createServer, normalizePath } from 'vite'

/** Imports every route module for real through Vite's transform pipeline.
 *  Needs its own server even inside a build environment's buildStart - a
 *  build environment has no ssrLoadModule equivalent, only a dev server
 *  does, so there's no way to get real executed exports otherwise. entries
 *  is built via Promise.all rather than assigning into a shared object -
 *  its result array preserves input order regardless of which module
 *  resolves first, so the sorted order survives; concurrent callbacks
 *  writing into an object wouldn't, since insertion order would follow
 *  resolution timing instead.
 *
 *  root is passed explicitly and used two different ways: globSync is a
 *  plain Node fs call, so its cwd needs an absolute path (root + appDir) -
 *  Vite's own root option has no effect on it. ssrLoadModule is a Vite
 *  call, so its module id stays root-relative ('/' + appDir), resolved
 *  correctly as long as the server itself is configured with root. */
export async function ssrGlob<T>(appDir: string, root: string): Promise<Array<[string, T]>> {
  const server = await createServer({
    root,
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true },
  })
  try {
    const paths = globSync('**/*.tsx', { cwd: join(root, appDir) }).map(normalizePath).sort()
    const modules = paths.map(async path => [path, await server.ssrLoadModule(`/${appDir}/${path}`)] as [string, T])
    return await Promise.all(modules)
  }
  finally {
    await server.close()
  }
}
