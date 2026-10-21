import type { Diagnostic, Endpoint, PositionNode } from '@/pen-core'
import type { ComponentMap } from '@/pen-react/renderer/types/component-map'
import type { AnyComponent } from './build-component-map'
import { createDiagnostic, GLOBAL_DEFAULT, GLOBAL_ERROR } from '@/pen-core'

/** Validates that every discovered module has a valid component default export. */
export function validateComponentExports(modulePaths: string[], allComponents: Record<string, AnyComponent>): Diagnostic[] {
  const diagnostics: Diagnostic[] = []

  for (const path of modulePaths) {
    // The framework's own built-in fallbacks, not a file the user wrote -
    // nothing to validate, and their names get minified in the published build
    if (path === GLOBAL_DEFAULT || path === GLOBAL_ERROR) continue

    const Content = allComponents[path]
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
  return diagnostics
}

/** Validates that every async page has a loading.tsx in its frame chain. */
export function validateAsyncPages(pageEndpoints: Endpoint<PositionNode>[], componentMap: ComponentMap): Diagnostic[] {
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
