import type { Diagnostic, Endpoint } from '@/pen-core'
import type { ComponentMap } from '@/pen-react/modules'
import { createDiagnostic } from '@/pen-core'

/** Validates that every discovered module has a valid component default export. */
export function validateComponentExports(componentMap: ComponentMap): Diagnostic[] {
  const diagnostics: Diagnostic[] = []

  for (const components of Object.values(componentMap)) {
    for (const [path, Content] of Object.entries(components)) {
      if (typeof Content !== 'function') {
        diagnostics.push(createDiagnostic({
          rule: 'invalid-component-export',
          severity: 'error',
          description: 'its default export is not a valid React component',
          files: [path],
        }))
      }
      else if (!/^[A-Z]/.test(Content.name)) {
        diagnostics.push(createDiagnostic({
          rule: 'unnamed-component-export',
          severity: 'warn',
          description:
            'its default export is an anonymous or lowercase-named function - ' +
            '`pen dev`\'s Fast Refresh only recognizes components whose name starts with a capital letter',
          files: [path],
        }))
      }
    }
  }
  return diagnostics
}

/** Validates that every async page has a loading.tsx in its frame chain. */
export function validateAsyncPages(pageEndpoints: Endpoint<unknown>[], componentMap: ComponentMap): Diagnostic[] {
  const diagnostics: Diagnostic[] = []

  for (const endpoint of pageEndpoints) {
    // Mirrors render.tsx's renderChain: a page endpoint's content is its own
    // page.tsx, or the nearest default.tsx when there's no page.tsx at all.
    const Content = componentMap.page[endpoint.contentPath] ?? componentMap.default[endpoint.contentPath]
    if (Content?.constructor.name === 'AsyncFunction' && !endpoint.frames.some(frame => frame.loading)) {
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
