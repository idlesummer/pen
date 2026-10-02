import type { Diagnostic, Endpoint } from '@/pen-core'
import type { RouteComponent } from '@/pen-react/runtime'
import { createDiagnostic } from '@/pen-core'
import { isAsyncComponent } from '@/pen-react/runtime'

/** Validates that every discovered module has a valid component default export. */
export function validateComponentExports(modulePaths: string[], routeComponents: Record<string, RouteComponent | undefined>): Diagnostic[] {
  const diagnostics: Diagnostic[] = []

  for (const path of modulePaths) {
    const Content = routeComponents[path]! // Safe - modulePaths is a subset of components's keys
    if (typeof Content !== 'function') {
      diagnostics.push(createDiagnostic({
        rule: 'invalid-component-export',
        severity: 'error',
        description: 'its default export is not a valid React component',
        files: [path],
      }))
    }
  }
  return diagnostics
}

/** Validates that every async page has a loading.tsx in its frame chain. */
export function validateAsyncPages(pageEndpoints: Endpoint[], routeComponents: Record<string, RouteComponent | undefined>): Diagnostic[] {
  const diagnostics: Diagnostic[] = []

  for (const endpoint of pageEndpoints) {
    const Content = routeComponents[endpoint.contentPath]! // Safe - every real page endpoint has a discovered component
    if (Content && isAsyncComponent(Content) && !endpoint.frames.some(frame => frame.loading)) {
      diagnostics.push(createDiagnostic({
        rule: 'async-page-missing-loading',
        severity: 'error',
        description: 'is an async page, so its route needs a loading.tsx to suspend into',
        files: [endpoint.contentPath],
      }))
    }
  }
  return diagnostics
}
