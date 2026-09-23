import type { Diagnostic, Endpoint } from '@/core'
import type { RouteComponent } from '@/react'
import { createServer } from 'vite'
import { GLOBAL_DEFAULT, GLOBAL_ERROR } from '@/core'
import { DefaultFallback, ErrorFallback, isAsyncComponent } from '@/react'

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

/** Module-level validation: checks only decidable once real components have
 *  been imported (e.g. whether a page is declared `async`), unlike the
 *  file-tree validation compileApp runs on path strings alone. Runs once,
 *  eagerly, against every route the app can render - not reactively on
 *  whichever one a user happens to visit first, so a misconfigured page
 *  can't ship silently. */
function validateModules(pageEndpoints: Endpoint[], modulePaths: string[], componentsByPath: Map<string, RouteComponent>): Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  const invalid = new Set<string>()

  for (const path of modulePaths) {
    const Content = componentsByPath.get(path)! // Safe - modulePaths is a subset of componentsByPath.keys()
    if (typeof Content !== 'function') {
      invalid.add(path)
      diagnostics.push({
        rule: 'invalid-component-export',
        severity: 'error',
        message: 'its default export is not a valid React component',
        files: [path],
      })
    }
  }
  for (const endpoint of pageEndpoints) {
    if (invalid.has(endpoint.content)) continue // Already reported - isAsyncComponent would throw on a non-function value

    const Content = componentsByPath.get(endpoint.content)!
    if (isAsyncComponent(Content) && !endpoint.frames.some(frame => frame.loading)) {
      diagnostics.push({
        rule: 'async-page-missing-loading',
        severity: 'error',
        message: 'is an async page, so its route needs a loading.tsx to suspend into',
        files: [endpoint.content],
      })
    }
  }
  return diagnostics
}
