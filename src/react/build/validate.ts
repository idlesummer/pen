import type { Diagnostic, Endpoint } from '@/core'
import type { RouteComponent } from '@/react'
import { isAsyncComponent } from '@/react'

/** Every discovered module's default export must be a real component -
 *  typeof 'function' covers sync, class, and async components alike, and
 *  catches what TypeScript alone can't guarantee (a missing default export,
 *  or one of the wrong shape). The same failure Next.js surfaces as "the
 *  default export is not a React Component". */
export function validateComponentExports(modulePaths: string[], componentsByPath: Map<string, RouteComponent>): Diagnostic[] {
  const diagnostics: Diagnostic[] = []

  for (const path of modulePaths) {
    const Content = componentsByPath.get(path)! // Safe - modulePaths is a subset of componentsByPath.keys()
    if (typeof Content !== 'function') {
      diagnostics.push({
        rule: 'invalid-component-export',
        severity: 'error',
        message: 'its default export is not a valid React component',
        files: [path],
      })
    }
  }
  return diagnostics
}

/** Every async page's frame chain needs a loading.tsx to suspend into -
 *  checked against every route the app can render, not reactively on
 *  whichever one a user happens to visit first, so a misconfigured page
 *  can't ship silently. The typeof guard skips a module already reported
 *  invalid by validateComponentExports, since isAsyncComponent would throw
 *  on a non-function value. */
export function validateAsyncPages(pageEndpoints: Endpoint[], componentsByPath: Map<string, RouteComponent>): Diagnostic[] {
  const diagnostics: Diagnostic[] = []

  for (const endpoint of pageEndpoints) {
    const Content = componentsByPath.get(endpoint.content)! // Safe - every real page endpoint has a discovered component
    if (typeof Content === 'function' && isAsyncComponent(Content) && !endpoint.frames.some(frame => frame.loading)) {
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
