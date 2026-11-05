import { describe, expect, test } from 'vitest'
import { createRouteTree } from '../compiler/route/route-tree'
import { GLOBAL_FALLBACK } from '../compiler/route/route-module'
import { createPositionEndpoints, type FrameContext } from '../compiler/position/position-endpoints'
import type { PositionNode } from '../compiler/position/position-tree'

function createContext(): FrameContext<PositionNode> {
  return { slotsOf: new Map(), frameOf: new Map(), fallbackFrameOf: new Map() }
}

describe('createPositionEndpoints', () => {
  test('falls back to the sentinel when nothing has an explicit fallback.tsx', () => {
    const tree = createRouteTree(['page.tsx'])
    const [fallback, endpoint] = createPositionEndpoints({ page: tree, fallback: tree }, createContext())
    expect(fallback.contentPath).toBe(GLOBAL_FALLBACK)
    expect(endpoint?.contentPath).toBe('page.tsx')
  })

  test('creates no page endpoint when there is no page owner', () => {
    const tree = createRouteTree(['layout.tsx'])
    const [, endpoint] = createPositionEndpoints({ fallback: tree }, createContext())
    expect(endpoint).toBeUndefined()
  })

  test('the fallback endpoint uses the real fallback.tsx path when one exists', () => {
    const tree = createRouteTree(['fallback.tsx', 'page.tsx'])
    const [fallback] = createPositionEndpoints({ page: tree, fallback: tree }, createContext())
    expect(fallback.contentPath).toBe('fallback.tsx')
  })

  test('frames are ordered outermost first - the last frame is the endpoint\'s own parent', () => {
    const tree = createRouteTree(['layout.tsx', 'blog/loading.tsx', 'blog/page.tsx'])
    const blog = tree.children[0]!
    const [, endpoint] = createPositionEndpoints({ page: blog, fallback: tree }, createContext())
    expect(endpoint!.frames).toHaveLength(2)
    expect(endpoint!.frames[0]!.layout).toBe('layout.tsx')
    expect(endpoint!.frames[1]!.loading).toBe('blog/loading.tsx')
  })

  test('a boundary\'s own fallback endpoint strips the fallback field from its last frame', () => {
    const tree = createRouteTree(['layout.tsx', 'fallback.tsx'])
    const [fallback] = createPositionEndpoints({ fallback: tree }, createContext())
    expect(fallback.frames.every(frame => !frame.fallback)).toBe(true)
    expect(fallback.frames[0]!.layout).toBe('layout.tsx')
  })
})
