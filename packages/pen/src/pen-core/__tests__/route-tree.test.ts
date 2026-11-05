import { describe, expect, test } from 'vitest'
import { GLOBAL_FALLBACK, GLOBAL_ERROR } from '../compiler/route/route-module'
import {
  createRouteTree,
  getModuleRole,
  forEach,
  getRouteSource,
  compactMapAncestors,
  type RouteNode,
} from '../compiler/route/route-tree'

describe('getModuleRole', () => {
  test('resolves a role from a file name', () => {
    expect(getModuleRole('page.tsx')).toBe('page')
    expect(getModuleRole('layout.tsx')).toBe('layout')
    expect(getModuleRole('loading.tsx')).toBe('loading')
    expect(getModuleRole('error.tsx')).toBe('error')
    expect(getModuleRole('fallback.tsx')).toBe('fallback')
  })

  test('resolves the global sentinels to their role', () => {
    expect(getModuleRole(GLOBAL_FALLBACK)).toBe('fallback')
    expect(getModuleRole(GLOBAL_ERROR)).toBe('error')
  })
})

describe('createRouteTree', () => {
  test('builds a single root page', () => {
    const tree = createRouteTree(['page.tsx'])
    expect(tree.type).toBe('root')
    expect(tree.modules.page).toBe('page.tsx')
    expect(tree.children).toEqual([])
  })

  test('ignores file paths that are not route modules', () => {
    const tree = createRouteTree(['page.tsx', 'blog/readme.md'])
    expect(tree.children).toEqual([])
  })

  test('nests a static folder as a child route', () => {
    const tree = createRouteTree(['page.tsx', 'blog/page.tsx'])
    expect(tree.children).toHaveLength(1)

    const blog = tree.children[0]!
    expect(blog.type).toBe('static')
    expect(blog.name).toBe('blog')
    expect(blog.path).toBe('blog')
    expect(blog.modules.page).toBe('blog/page.tsx')
    expect(blog.parent).toBe(tree)
  })

  test('parses dynamic and catch-all segments, accumulating bound params in order', () => {
    const tree = createRouteTree(['[category]/[id]/page.tsx'])
    const category = tree.children[0]!
    const id = category.children[0]!

    expect(category.type).toBe('dynamic')
    expect(category.segment).toBe('category')
    expect(category.params).toEqual(['category'])

    expect(id.type).toBe('dynamic')
    expect(id.segment).toBe('id')
    expect(id.params).toEqual(['category', 'id'])
  })

  test('catch-all segments bind their own param', () => {
    const tree = createRouteTree(['[...slug]/page.tsx'])
    const slug = tree.children[0]!
    expect(slug.type).toBe('catchall')
    expect(slug.params).toEqual(['slug'])
  })

  test('prunes everything under a private folder', () => {
    const tree = createRouteTree(['_lib/page.tsx', '_lib/nested/page.tsx'])
    expect(tree.children).toEqual([])
  })

  test('a boundary route with no fallback.tsx falls back to itself', () => {
    const tree = createRouteTree(['page.tsx'])
    expect(tree.fallback).toBe(tree)
  })

  test('a non-boundary route with no fallback.tsx inherits the nearest ancestor fallback', () => {
    const tree = createRouteTree(['page.tsx', 'blog/page.tsx'])
    const blog = tree.children[0]!
    expect(blog.fallback).toBe(tree)
  })

  test('a route with its own fallback.tsx owns its fallback, and descendants inherit it', () => {
    const tree = createRouteTree(['blog/fallback.tsx', 'blog/post/page.tsx'])
    const blog = tree.children[0]!
    const post = blog.children[0]!

    expect(blog.modules.fallback).toBe('blog/fallback.tsx')
    expect(blog.fallback).toBe(blog)
    expect(post.fallback).toBe(blog)
  })

  test('a slot is a boundary and does not inherit its parent fallback', () => {
    const tree = createRouteTree(['@modal/page.tsx'])
    const modal = tree.children[0]!
    expect(modal.type).toBe('slot')
    expect(modal.fallback).toBe(modal)
  })
})

describe('forEach', () => {
  test('visits every node in the tree, including the root', () => {
    const tree = createRouteTree(['page.tsx', 'blog/page.tsx', 'blog/[id]/page.tsx'])
    const visited: string[] = []
    forEach(tree, route => visited.push(route.path))

    expect(visited).toEqual(['', 'blog', 'blog/[id]'])
  })
})

describe('getRouteSource', () => {
  test('returns the first module path when one exists', () => {
    const tree = createRouteTree(['page.tsx', 'blog/layout.tsx', 'blog/page.tsx'])
    const blog = tree.children[0]!
    expect(getRouteSource(blog)).toBe(blog.modules.layout)
  })

  test('falls back to the route path when there are no modules', () => {
    const route: RouteNode = {
      name: 'group', type: 'group', segment: 'group', path: 'group',
      modules: {}, fallback: undefined as never, params: [], children: [],
    }
    expect(getRouteSource(route)).toBe('group')
  })
})

describe('compactMapAncestors', () => {
  test('walks from the route up to and including the nearest boundary', () => {
    const tree = createRouteTree(['blog/post/page.tsx'])
    const blog = tree.children[0]!
    const post = blog.children[0]!

    const names = compactMapAncestors(post, node => node.name)
    expect(names).toEqual(['post', 'blog', ''])
  })

  test('skips ancestors for which the mapper returns undefined', () => {
    const tree = createRouteTree(['layout.tsx', 'blog/post/page.tsx'])
    const blog = tree.children[0]!
    const post = blog.children[0]!

    const layouts = compactMapAncestors(post, node => node.modules.layout)
    expect(layouts).toEqual(['layout.tsx'])
  })
})
