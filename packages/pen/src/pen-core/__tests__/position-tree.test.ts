import { describe, expect, test } from 'vitest'
import { createRouteTree } from '../compiler/route/route-tree'
import { GLOBAL_FALLBACK, GLOBAL_ERROR } from '../compiler/route/route-module'
import { createPositionTree } from '../compiler/position/position-tree'

describe('createPositionTree', () => {
  test('builds a working endpoint and fallback for a simple app', () => {
    const tree = createRouteTree(['page.tsx'])
    const [positionTree, , modulePaths, pageEndpoints] = createPositionTree(tree)

    expect(positionTree.pageEndpoint?.contentPath).toBe('page.tsx')
    expect(positionTree.fallbackEndpoint.contentPath).toBe(GLOBAL_FALLBACK)
    // The root is a boundary, so its own frame always carries the error/fallback
    // sentinels too - they wrap the root's content, not just the fallback endpoint.
    expect(modulePaths).toEqual([GLOBAL_ERROR, GLOBAL_FALLBACK, 'page.tsx'])
    expect(pageEndpoints).toHaveLength(1)
  })

  test('collects every distinct module path used by frames and content, sorted', () => {
    const tree = createRouteTree(['layout.tsx', 'blog/loading.tsx', 'blog/page.tsx'])
    const [, , modulePaths] = createPositionTree(tree)
    expect(modulePaths).toEqual([GLOBAL_ERROR, GLOBAL_FALLBACK, 'blog/loading.tsx', 'blog/page.tsx', 'layout.tsx'])
  })

  test('a position with no page.tsx gets no page endpoint, only a fallback', () => {
    const tree = createRouteTree(['blog/layout.tsx'])
    const [positionTree] = createPositionTree(tree)
    const blog = positionTree.statics!['blog']!
    expect(blog.pageEndpoint).toBeUndefined()
    expect(blog.fallbackEndpoint).toBeDefined()
  })

  test('pageEndpoints only collects positions that actually have a page', () => {
    const tree = createRouteTree(['page.tsx', 'blog/layout.tsx', 'blog/post/page.tsx'])
    const [, , , pageEndpoints] = createPositionTree(tree)
    expect(pageEndpoints).toHaveLength(2)
  })
})
