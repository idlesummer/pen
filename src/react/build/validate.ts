import type { Diagnostic, Endpoint } from '@/router'
import type { RouteComponent } from '@/react'
import { createServer } from 'vite'
import { GLOBAL_DEFAULT, GLOBAL_ERROR } from '@/router'
import { DefaultFallback, ErrorFallback, validateModules } from '@/react'

/** Imports every route module for real through Vite's transform pipeline -
 *  the only way to know facts like "is this page async", which exist only
 *  on the executed function, never on its file path. A transient dev server
 *  in middleware mode does the importing; nothing here is served over HTTP,
 *  and it's closed before this returns. Keeps entry-app.tsx itself free of
 *  validation - by the time it runs, the app already passed this. */
export async function validateModuleExports(appDir: string, filePaths: string[], modulePaths: string[], pageEndpoints: Endpoint[]): Promise<Diagnostic[]> {
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
