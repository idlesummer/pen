import { describe, expect, test } from 'vitest'
import { createDiagnosticReport } from '../diagnostics/diagnose-routes'
import type { ModuleRegistry } from '../modules/module-registry'

describe('createDiagnosticReport', () => {
  test('a clean app has no warnings or error', () => {
    const moduleRegistry: ModuleRegistry = {
      page: { './page.tsx': { default: function Page() {} } },
      layout: {}, loading: {}, error: {}, fallback: {},
    }
    const [warnings, error] = createDiagnosticReport(moduleRegistry, '/app')
    expect(warnings).toEqual([])
    expect(error).toBeUndefined()
  })

  test('warns on a lowercase-named component, with its path prefixed by appDir', () => {
    const moduleRegistry: ModuleRegistry = {
      page: { './page.tsx': { default: function page() {} } },
      layout: {}, loading: {}, error: {}, fallback: {},
    }
    const [warnings] = createDiagnosticReport(moduleRegistry, '/app')
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('/app/page.tsx')
  })

  test('surfaces a route-tree error from the compiler, with its path prefixed by appDir', () => {
    const moduleRegistry: ModuleRegistry = {
      page: { './[bad name]/page.tsx': { default: function Page() {} } },
      layout: {}, loading: {}, error: {}, fallback: {},
    }
    const [, error] = createDiagnosticReport(moduleRegistry, '/app')
    expect(error).toContain('/app/[bad name]/page.tsx')
  })

  test('surfaces an async-page-missing-loading error', () => {
    const moduleRegistry: ModuleRegistry = {
      page: { './page.tsx': { default: async function Page() {} } },
      layout: {}, loading: {}, error: {}, fallback: {},
    }
    const [, error] = createDiagnosticReport(moduleRegistry, '/app')
    expect(error).toContain('async-page-missing-loading')
  })
})
