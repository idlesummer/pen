import { describe, expect, test } from 'vitest'
import { createRouteTree } from '../compiler/route/route-tree'
import { addOwnership, type Ownership } from '../compiler/position/position-ownership'

describe('addOwnership', () => {
  test('sets fallback ownership on first call, even without an explicit fallback.tsx', () => {
    const tree = createRouteTree(['blog/page.tsx'])
    const blog = tree.children[0]!
    const ownership: Ownership = {}
    addOwnership(ownership, blog)
    expect(ownership.fallback).toBe(blog.fallback)
  })

  test('a route with an explicit fallback.tsx overrides an already-set inherited owner', () => {
    const treeA = createRouteTree(['a/page.tsx'])
    const treeB = createRouteTree(['b/fallback.tsx'])
    const ownership: Ownership = {}
    addOwnership(ownership, treeA.children[0]!)
    addOwnership(ownership, treeB.children[0]!)
    expect(ownership.fallback).toBe(treeB.children[0])
  })

  test('an inherited owner does not override an already-set explicit one', () => {
    const treeA = createRouteTree(['a/fallback.tsx'])
    const treeB = createRouteTree(['b/page.tsx'])
    const ownership: Ownership = {}
    addOwnership(ownership, treeA.children[0]!)
    addOwnership(ownership, treeB.children[0]!)
    expect(ownership.fallback).toBe(treeA.children[0])
  })

  test('the first page wins; a later page does not override it', () => {
    const treeA = createRouteTree(['a/page.tsx'])
    const treeB = createRouteTree(['b/page.tsx'])
    const ownership: Ownership = {}
    addOwnership(ownership, treeA.children[0]!)
    addOwnership(ownership, treeB.children[0]!)
    expect(ownership.page).toBe(treeA.children[0])
  })
})
