import type { Diagnostic, Endpoint } from '@/core'
import type { RouteComponent } from '@/react'
import { isAsyncComponent } from '@/react'

/** Every discovered module's default export must be a real component -
 *  typeof 'function' covers sync, class, and async components alike, and
 *  catches what TypeScript alone can't guarantee (a missing default export,
 *  or one of the wrong shape). The same failure Next.js surfaces as "the
 *  default export is not a React Component". */
export function validateComponentExports(modulePaths: string[], components: Map<string, RouteComponent | undefined>): Diagnostic[] {
  const diagnostics: Diagnostic[] = []

  for (const path of modulePaths) {
    const Content = components.get(path)! // Safe - modulePaths is a subset of components.keys()
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
 *  can't ship silently. The `Content &&` isn't re-asserting key presence -
 *  that's what the ! already covers - it's asking whether the value found
 *  there is actually usable, the same question validateComponentExports
 *  asks; isAsyncComponent would throw reading .constructor off a value
 *  that fails it. */
export function validateAsyncPages(pageEndpoints: Endpoint[], components: Map<string, RouteComponent | undefined>): Diagnostic[] {
  const diagnostics: Diagnostic[] = []

  for (const endpoint of pageEndpoints) {
    const Content = components.get(endpoint.content)! // Safe - every real page endpoint has a discovered component
    if (Content && isAsyncComponent(Content) && !endpoint.frames.some(frame => frame.loading)) {
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
