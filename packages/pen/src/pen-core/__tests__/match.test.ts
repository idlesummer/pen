import { describe, expect, test } from 'vitest'
import { createRouteTree } from '../compiler/route/route-tree'
import { createPositionTree } from '../compiler/position/position-tree'
import { match } from '../runtime/matcher/match'

function compile(filePaths: string[]) {
  const [positionTree] = createPositionTree(createRouteTree(filePaths))
  return positionTree
}

describe('match', () => {
  test('matches a page and returns its bound params', () => {
    const positionTree = compile(['[id]/page.tsx'])
    const result = match(positionTree, '/42')
    expect(result.endpoint.contentPath).toBe('[id]/page.tsx')
    expect(result.endpoint.params).toEqual({ id: '42' })
  })

  test('ignores leading, trailing, and duplicate slashes', () => {
    const positionTree = compile(['blog/page.tsx'])
    const result = match(positionTree, '//blog//')
    expect(result.endpoint.contentPath).toBe('blog/page.tsx')
  })

  test('scopes each frame\'s params to only the names it binds', () => {
    const positionTree = compile(['[a]/layout.tsx', '[a]/[b]/page.tsx'])
    const result = match(positionTree, '/x/y')
    expect(result.endpoint.params).toEqual({ a: 'x', b: 'y' })

    const layoutFrame = result.endpoint.frames.find(frame => frame.layout)!
    expect(layoutFrame.params).toEqual({ a: 'x' })
  })

  test('resolves a declared slot independently, using the same url', () => {
    const positionTree = compile(['layout.tsx', 'page.tsx', '@modal/page.tsx', '@modal/settings/page.tsx'])
    const result = match(positionTree, '/settings')

    const layoutFrame = result.endpoint.frames.find(frame => frame.slots)!
    const modal = layoutFrame.slots!['modal']!
    expect(modal.endpoint.contentPath).toBe('@modal/settings/page.tsx')
  })
})
