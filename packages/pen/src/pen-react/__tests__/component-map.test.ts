import { describe, expect, test } from 'vitest'
import { createComponentMap } from '../modules/component-map'
import type { ModuleRegistry } from '../modules/module-registry'

function Page() {}
function Layout() {}

describe('createComponentMap', () => {
  test('extracts function default exports, stripping a leading "./"', () => {
    const registry: ModuleRegistry = {
      page: { './page.tsx': { default: Page } },
      layout: {}, loading: {}, error: {}, fallback: {},
    }
    const [componentMap] = createComponentMap(registry)
    expect(componentMap.page['page.tsx']).toBe(Page)
  })

  test('skips modules with no function default export', () => {
    const registry: ModuleRegistry = {
      page: {
        './good.tsx': { default: Page },
        './no-default.tsx': {},
        './not-a-function.tsx': { default: 'not a function' },
      },
      layout: {}, loading: {}, error: {}, fallback: {},
    }
    const [componentMap] = createComponentMap(registry)
    expect(Object.keys(componentMap.page)).toEqual(['good.tsx'])
  })

  test('collects every component path across all roles', () => {
    const registry: ModuleRegistry = {
      page: { './page.tsx': { default: Page } },
      layout: { './layout.tsx': { default: Layout } },
      loading: {}, error: {}, fallback: {},
    }
    const [, componentPaths] = createComponentMap(registry)
    expect(componentPaths.sort()).toEqual(['layout.tsx', 'page.tsx'])
  })
})
