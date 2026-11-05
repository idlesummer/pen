import { describe, expect, test } from 'vitest'
import { createRouteTree } from '../compiler/route/route-tree'
import { createPartialPositionTree } from '../compiler/position/position-partial-tree'

describe('createPartialPositionTree', () => {
  test('static siblings each get their own distinct position', () => {
    const tree = createRouteTree(['a/page.tsx', 'b/page.tsx'])
    const [positionTree] = createPartialPositionTree(tree)
    const a = positionTree.statics!['a']!
    const b = positionTree.statics!['b']!
    expect(a).not.toBe(b)
    expect(a.urlDepth).toBe(1)
  })

  test('a group folder collapses onto its parent position', () => {
    const tree = createRouteTree(['(marketing)/page.tsx'])
    const [positionTree, claimsOf] = createPartialPositionTree(tree)
    expect(positionTree.statics).toBeUndefined()
    expect(claimsOf.get(positionTree)!.page).toEqual([tree.children[0]])
  })

  test('dynamic and catch-all each get exactly one position slot', () => {
    const tree = createRouteTree(['[id]/page.tsx'])
    const [positionTree] = createPartialPositionTree(tree)
    expect(positionTree.dynamic?.param).toBe('id')
    expect(positionTree.dynamic?.urlDepth).toBe(1)
    expect(positionTree.dynamic?.dynamicCount).toBe(1)
  })

  test('catch-all subtrees are not traversed further', () => {
    const tree = createRouteTree(['[...slug]/page.tsx', '[...slug]/nested/page.tsx'])
    const [, claimsOf] = createPartialPositionTree(tree)
    expect(claimsOf.size).toBe(2) // root + the catch-all itself; 'nested' is never visited
  })

  test('slots are tracked separately from the main position tree', () => {
    const tree = createRouteTree(['@modal/page.tsx', 'page.tsx'])
    const [positionTree, , , slotsOf] = createPartialPositionTree(tree)
    expect(positionTree.statics).toBeUndefined()
    expect(slotsOf.get(tree)!['modal']).toBeDefined()
  })

  test('a slot cannot contain another slot - only the outer one is traversed', () => {
    const tree = createRouteTree(['@modal/@inner/page.tsx'])
    const [, claimsOf] = createPartialPositionTree(tree)
    expect(claimsOf.size).toBe(2) // root and @modal; @inner is filtered out of @modal's own children
  })

  test('a malformed route is never traversed', () => {
    const tree = createRouteTree(['[bad name]/page.tsx'])
    const [, claimsOf] = createPartialPositionTree(tree)
    expect(claimsOf.size).toBe(1) // only root is ever visited
  })
})
