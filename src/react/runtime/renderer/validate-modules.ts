import type { Diagnostic, Endpoint } from '@/router'
import type { RouteComponent } from './component-map'
import { isAsyncComponent } from './route-modules/PageComponent'

/** Module-level validation: checks only decidable once real components have
 *  been imported (e.g. whether a page is declared `async`), unlike the
 *  file-tree validation compileApp runs on path strings alone. Runs once,
 *  eagerly, against every route the app can render - not reactively on
 *  whichever one a user happens to visit first, so a misconfigured page
 *  can't ship silently. */
export function validateModules(pageEndpoints: Endpoint[], componentsByPath: Map<string, RouteComponent>): Diagnostic[] {
  const diagnostics: Diagnostic[] = []

  for (const endpoint of pageEndpoints) {
    const Content = componentsByPath.get(endpoint.content)! // Safe - every real page endpoint has a discovered component
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
