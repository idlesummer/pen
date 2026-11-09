import type { Match } from '@/pen-core'
import type { ComponentMap } from '../modules/component-map'
import { describe, expect, test } from 'vitest'
import { createComponentTree } from '../renderer/composer/component-tree'

function Page() {}
function Layout() {}
function Loading() {}
function ErrorComponent() {}
function Fallback() {}

function componentMap(): ComponentMap {
  return {
    page: { 'page.tsx': Page as unknown as ComponentMap['page'][string] },
    layout: { 'layout.tsx': Layout as unknown as ComponentMap['layout'][string] },
    loading: { 'loading.tsx': Loading as unknown as ComponentMap['loading'][string] },
    error: { 'error.tsx': ErrorComponent as unknown as ComponentMap['error'][string] },
    fallback: { 'fallback.tsx': Fallback as unknown as ComponentMap['fallback'][string] },
  }
}

describe('createComponentTree', () => {
  test('resolves the endpoint content from the page map', () => {
    const match: Match = { endpoint: { contentPath: 'page.tsx', frames: [], params: {} } }
    const tree = createComponentTree(match, componentMap())
    expect(tree.endpoint.Content).toBe(Page)
  })

  test('falls back to the fallback map when the content path is not a page', () => {
    const match: Match = { endpoint: { contentPath: 'fallback.tsx', frames: [], params: {} } }
    const tree = createComponentTree(match, componentMap())
    expect(tree.endpoint.Content).toBe(Fallback)
  })

  test('resolves each frame\'s components from their module paths', () => {
    const match: Match = {
      endpoint: {
        contentPath: 'page.tsx',
        frames: [{ layout: 'layout.tsx', loading: 'loading.tsx', error: 'error.tsx', params: {} }],
        params: {},
      },
    }
    const tree = createComponentTree(match, componentMap())
    const frame = tree.endpoint.frames[0]!
    expect(frame.Layout).toBe(Layout)
    expect(frame.Loading).toBe(Loading)
    expect(frame.Error).toBe(ErrorComponent)
  })

  test('resolves a declared slot into its own component tree', () => {
    const slotMatch: Match = { endpoint: { contentPath: 'page.tsx', frames: [], params: {} } }
    const match: Match = {
      endpoint: {
        contentPath: 'page.tsx',
        frames: [{ layout: 'layout.tsx', slots: { modal: slotMatch }, params: {} }],
        params: {},
      },
    }
    const tree = createComponentTree(match, componentMap())
    const slot = tree.endpoint.frames[0]!.slots!['modal']!
    expect(slot.endpoint.Content).toBe(Page)
  })
})
