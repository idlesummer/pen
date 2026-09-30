import { globSync } from 'node:fs'
import { createServer } from 'vite'
import { normalize } from './normalize-path'

/** Imports every route module for real through Vite's transform pipeline.
 *  Needs its own server even inside a build environment's buildStart - a
 *  build environment has no ssrLoadModule equivalent, only a dev server
 *  does, so there's no way to get real executed exports otherwise. entries
 *  is built via Promise.all rather than assigning into a shared object -
 *  its result array preserves input order regardless of which module
 *  resolves first, so the sorted order survives; concurrent callbacks
 *  writing into an object wouldn't, since insertion order would follow
 *  resolution timing instead. */
export async function glob<T>(appDir: string): Promise<Array<[string, T]>> {
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true },
  })
  try {
    const paths = globSync('**/*.tsx', { cwd: appDir }).map(normalize).sort()
    const modules = paths.map(async path => [path, await server.ssrLoadModule(`/${appDir}/${path}`)] as [string, T])
    return await Promise.all(modules)
  }
  finally {
    await server.close()
  }
}
