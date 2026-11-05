import type { ReactElement } from 'react'
import { describe, expect, test } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import { createRouteRendererStore } from '../renderer/route-renderer-store'
import { createRouteRenderer } from '../renderer/route-renderer'
import type { ModuleRegistry } from '../modules/module-registry'

function moduleRegistryWith(text: string): ModuleRegistry {
  return {
    page: { './page.tsx': { default: () => <Text>{text}</Text> } },
    layout: {}, loading: {}, error: {}, fallback: {},
  }
}

describe('createRouteRendererStore', () => {
  test('getState returns a working route renderer', () => {
    const store = createRouteRendererStore(moduleRegistryWith('hello'))
    const { lastFrame } = render(store.getState()('/') as ReactElement)
    expect(lastFrame()).toBe('hello')
  })

  test('setState swaps the renderer and notifies subscribers', () => {
    const store = createRouteRendererStore(moduleRegistryWith('first'))
    let notified = false
    store.subscribe(() => { notified = true })

    store.setState(() => createRouteRenderer(moduleRegistryWith('second')))

    expect(notified).toBe(true)
    const { lastFrame } = render(store.getState()('/') as ReactElement)
    expect(lastFrame()).toBe('second')
  })
})
