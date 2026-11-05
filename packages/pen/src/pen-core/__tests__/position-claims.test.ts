import { describe, expect, test } from 'vitest'
import { createRouteTree } from '../compiler/route/route-tree'
import { createClaims, addClaims } from '../compiler/position/position-claims'

describe('createClaims', () => {
  test('starts empty', () => {
    expect(createClaims()).toEqual({ page: [], fallback: [], dynamic: [], catchall: [] })
  })
})

describe('addClaims', () => {
  test('records a page claim', () => {
    const tree = createRouteTree(['page.tsx'])
    const claims = createClaims()
    addClaims(claims, tree)
    expect(claims.page).toEqual([tree])
  })

  test('records the fallback owner, not the route itself', () => {
    const tree = createRouteTree(['blog/fallback.tsx', 'blog/post/page.tsx'])
    const blog = tree.children[0]!
    const post = blog.children[0]!
    const claims = createClaims()
    addClaims(claims, post)
    expect(claims.fallback).toEqual([blog])
  })

  test('records no fallback claim when nothing along the chain has an explicit fallback.tsx', () => {
    const tree = createRouteTree(['blog/page.tsx'])
    const blog = tree.children[0]!
    const claims = createClaims()
    addClaims(claims, blog)
    expect(claims.fallback).toEqual([])
  })

  test('records dynamic routes', () => {
    const tree = createRouteTree(['[id]/page.tsx'])
    const id = tree.children[0]!
    const claims = createClaims()
    addClaims(claims, id)
    expect(claims.dynamic).toEqual([id])
    expect(claims.catchall).toEqual([])
  })

  test('records catch-all routes', () => {
    const tree = createRouteTree(['[...slug]/page.tsx'])
    const slug = tree.children[0]!
    const claims = createClaims()
    addClaims(claims, slug)
    expect(claims.catchall).toEqual([slug])
    expect(claims.dynamic).toEqual([])
  })
})
