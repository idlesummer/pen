import { describe, expect, test } from 'vitest'
import { createRouteTree } from '../compiler/route/route-tree'
import { createPositionTree } from '../compiler/position/position-tree'
import { findPositionEndpoint } from '../runtime/matcher/find'

function compile(filePaths: string[]) {
  const [positionTree] = createPositionTree(createRouteTree(filePaths))
  return positionTree
}

describe('findPositionEndpoint', () => {
  test('matches an exact static page', () => {
    const positionTree = compile(['page.tsx', 'blog/page.tsx'])
    const [endpoint, params] = findPositionEndpoint(positionTree, ['blog'])
    expect(endpoint.contentPath).toBe('blog/page.tsx')
    expect(params).toEqual({})
  })

  test('prefers a static match over a dynamic sibling', () => {
    const positionTree = compile(['blog/page.tsx', '[slug]/page.tsx'])
    const [endpoint] = findPositionEndpoint(positionTree, ['blog'])
    expect(endpoint.contentPath).toBe('blog/page.tsx')
  })

  test('falls back to the dynamic sibling when there is no static match', () => {
    const positionTree = compile(['blog/page.tsx', '[slug]/page.tsx'])
    const [endpoint, params] = findPositionEndpoint(positionTree, ['other'])
    expect(endpoint.contentPath).toBe('[slug]/page.tsx')
    expect(params).toEqual({ slug: 'other' })
  })

  test('a catch-all accepts any remaining depth and captures it as an array', () => {
    const positionTree = compile(['[...slug]/page.tsx'])
    const [endpoint, params] = findPositionEndpoint(positionTree, ['a', 'b', 'c'])
    expect(endpoint.contentPath).toBe('[...slug]/page.tsx')
    expect(params).toEqual({ slug: ['a', 'b', 'c'] })
  })

  test('falls back to the nearest fallback when nothing matches', () => {
    const positionTree = compile(['page.tsx'])
    const [endpoint] = findPositionEndpoint(positionTree, ['nowhere'])
    expect(endpoint).toBe(positionTree.fallbackEndpoint)
  })

  test('an exhausted url with no page at this position still returns a fallback', () => {
    const positionTree = compile(['blog/layout.tsx'])
    const [endpoint] = findPositionEndpoint(positionTree, ['blog'])
    expect(endpoint).toBe(positionTree.statics!['blog']!.fallbackEndpoint)
  })
})
