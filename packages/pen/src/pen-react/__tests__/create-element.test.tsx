import type { ReactElement, ReactNode } from 'react'
import { describe, expect, test } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import { createRouter } from '@/pen-core'
import { createRouteElement } from '../renderer/composer/create-element'
import { showFallback } from '../modules/components/FallbackBoundary'
import type { ComponentMap } from '../modules/component-map'

function createTestRouteMatcher(filePaths: string[]) {
  return createRouter(filePaths).routeMatcher
}

function buildComponentMap(partial: Partial<ComponentMap>): ComponentMap {
  return {
    page: {}, layout: {}, loading: {}, error: {}, fallback: {},
    ...partial,
  } as ComponentMap
}

describe('createRouteElement', () => {
  test('renders page content directly when there are no wrapping frames', () => {
    const routeMatcher = createTestRouteMatcher(['page.tsx'])
    const componentMap = buildComponentMap({
      page: { 'page.tsx': (() => <Text>hello</Text>) as never },
    })
    const { lastFrame } = render(createRouteElement('/', routeMatcher, componentMap) as ReactElement)
    expect(lastFrame()).toBe('hello')
  })

  test('wraps content with a layout', () => {
    const routeMatcher = createTestRouteMatcher(['layout.tsx', 'page.tsx'])
    const componentMap = buildComponentMap({
      page: { 'page.tsx': (() => <Text>content</Text>) as never },
      layout: { 'layout.tsx': (({ children }: { children: ReactNode }) => <><Text>layout:</Text>{children}</>) as never },
    })
    const { lastFrame } = render(createRouteElement('/', routeMatcher, componentMap) as ReactElement)
    expect(lastFrame()).toBe('layout:\ncontent')
  })

  test('catches a thrown error via the frame\'s error boundary', () => {
    const routeMatcher = createTestRouteMatcher(['error.tsx', 'page.tsx'])
    const componentMap = buildComponentMap({
      page: { 'page.tsx': (() => { throw new Error('boom') }) as never },
      error: { 'error.tsx': (({ error }: { error: Error }) => <Text>caught: {error.message}</Text>) as never },
    })
    const { lastFrame } = render(createRouteElement('/', routeMatcher, componentMap) as ReactElement)
    expect(lastFrame()).toBe('caught: boom')
  })

  test('catches showFallback() via the frame\'s fallback boundary', () => {
    const routeMatcher = createTestRouteMatcher(['fallback.tsx', 'page.tsx'])
    const componentMap = buildComponentMap({
      page: { 'page.tsx': (() => { showFallback(); return null }) as never },
      fallback: { 'fallback.tsx': (() => <Text>not found</Text>) as never },
    })
    const { lastFrame } = render(createRouteElement('/', routeMatcher, componentMap) as ReactElement)
    expect(lastFrame()).toBe('not found')
  })

  test('renders a declared slot, passed to the layout by its folder name', () => {
    const routeMatcher = createTestRouteMatcher(['layout.tsx', 'page.tsx', '@modal/page.tsx'])
    const componentMap = buildComponentMap({
      page: {
        'page.tsx': (() => <Text>main</Text>) as never,
        '@modal/page.tsx': (() => <Text>modal</Text>) as never,
      },
      layout: {
        'layout.tsx': (({ children, modal }: { children: ReactNode, modal: ReactNode }) =>
          <>{children}<Text>-</Text>{modal}</>) as never,
      },
    })
    const { lastFrame } = render(createRouteElement('/', routeMatcher, componentMap) as ReactElement)
    expect(lastFrame()).toBe('main\n-\nmodal')
  })
})
