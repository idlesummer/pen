import type { ReactElement } from 'react'
import { describe, expect, test } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import { createRouteRenderer } from '../renderer/route-renderer'
import type { ModuleRegistry } from '../modules/module-registry'

describe('createRouteRenderer', () => {
  test('resolves a raw module registry straight to rendered output', () => {
    const moduleRegistry: ModuleRegistry = {
      page: { './page.tsx': { default: () => <Text>hello</Text> } },
      layout: {}, loading: {}, error: {}, fallback: {},
    }
    const routeRenderer = createRouteRenderer(moduleRegistry)
    const { lastFrame } = render(routeRenderer('/') as ReactElement)
    expect(lastFrame()).toBe('hello')
  })

  test('falls back when the route has no matching page', () => {
    const moduleRegistry: ModuleRegistry = {
      page: { './page.tsx': { default: () => <Text>hello</Text> } },
      layout: {}, loading: {}, error: {}, fallback: {},
    }
    const routeRenderer = createRouteRenderer(moduleRegistry)
    const { lastFrame } = render(routeRenderer('/nowhere') as ReactElement)
    expect(lastFrame()).toBe('Page Not Found')
  })
})
