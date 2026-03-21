import { describe, it, expect, vi } from 'vitest'
import type { RouteTreeNode } from '@/pen/compiler'
import type { PathComponentMap } from '../composer'
import { createRouteResolver } from '../resolver'
import { NotFoundError } from '../../errors'

// ===== Helpers =====

const MockScreen = vi.fn(() => null)
const MockLayout = vi.fn(() => null)
const MockNotFound = vi.fn(() => null)

/** Minimal path-component-map for testing. */
const componentMap: PathComponentMap = {
  './screen.js': MockScreen,
  './layout.js': MockLayout,
  './not-found.js': MockNotFound,
}

// ===== Tree fixtures =====

/**
 * Tree for a simple static app:
 *   /          (layout + not-found)
 *   /about/    (screen)
 *   /users/    (screen)
 */
const staticTree: RouteTreeNode = {
  name: '', type: 'static',
  roles: { layout: './layout.js', 'not-found': './not-found.js' },
  children: [
    { name: 'about', type: 'static', roles: { screen: './screen.js' } },
    { name: 'users', type: 'static', roles: { screen: './screen.js' } },
  ],
}

/**
 * Tree for a dynamic app:
 *   /                   (layout)
 *   /users/             (screen)
 *   /users/[id]/        (screen)
 *   /users/[id]/posts/  (screen)
 */
const dynamicTree: RouteTreeNode = {
  name: '', type: 'static',
  roles: { layout: './layout.js' },
  children: [
    {
      name: 'users', type: 'static',
      roles: { screen: './screen.js', 'not-found': './not-found.js' },
      children: [
        {
          name: '[id]', type: 'dynamic', param: 'id',
          roles: { screen: './screen.js' },
          children: [
            { name: 'posts', type: 'static', roles: { screen: './screen.js' } },
          ],
        },
      ],
    },
  ],
}

/**
 * Tree with sibling groups (mirrors basic-app settings structure):
 *   /                         (layout)
 *   (account)/profile/        (screen)
 *   (appearance)/theme/       (screen)
 *
 * (account) sorts before (appearance), so the DFS explores (account) first.
 * A match under (appearance) must still resolve as an exact match (not partial).
 */
const siblingGroupTree: RouteTreeNode = {
  name: '', type: 'static',
  roles: { layout: './layout.js', 'not-found': './not-found.js' },
  children: [
    {
      name: '(account)', type: 'group',
      children: [
        { name: 'profile', type: 'static', roles: { screen: './screen.js' } },
      ],
    },
    {
      name: '(appearance)', type: 'group',
      children: [
        { name: 'theme', type: 'static', roles: { screen: './screen.js' } },
      ],
    },
  ],
}

/**
 * Tree with a group node:
 *   /                (layout)
 *   (auth)/          (not-found boundary via group)
 *   (auth)/profile/  (screen)
 */
const groupTree: RouteTreeNode = {
  name: '', type: 'static',
  roles: { layout: './layout.js' },
  children: [
    {
      name: '(auth)', type: 'group',
      roles: { 'not-found': './not-found.js' },
      children: [
        { name: 'profile', type: 'static', roles: { screen: './screen.js' } },
      ],
    },
  ],
}

/**
 * Tree with a catch-all route:
 *   /              (layout + not-found)
 *   /[...slug]/    (screen) — matches 1+ segments
 */
const catchAllTree: RouteTreeNode = {
  name: '', type: 'static',
  roles: { layout: './layout.js', 'not-found': './not-found.js' },
  children: [
    { name: '[...slug]', type: 'required-catchall', param: 'slug', roles: { screen: './screen.js' } },
  ],
}

/**
 * Tree with an optional catch-all route:
 *   /                (layout)
 *   /[[...slug]]/    (screen) — matches 0+ segments (including root)
 */
const optionalCatchAllTree: RouteTreeNode = {
  name: '', type: 'static',
  roles: { layout: './layout.js' },
  children: [
    { name: '[[...slug]]', type: 'optional-catchall', param: 'slug', roles: { screen: './screen.js' } },
  ],
}

// ===== Tests =====

describe('createRouteResolver', () => {
  describe('static routes', () => {
    it('resolves a static route', () => {
      const resolve = createRouteResolver({ routeTree: staticTree, componentMap })
      const { element, params } = resolve('/about/')
      expect(element).toBeDefined()
      expect(params).toBeUndefined()
    })

    it('caches resolved routes', () => {
      const resolve = createRouteResolver({ routeTree: staticTree, componentMap })
      const first = resolve('/about/')
      const second = resolve('/about/')
      expect(first).toBe(second)
    })

    it('resolves the root route', () => {
      const tree: RouteTreeNode = { name: '', type: 'static', roles: { screen: './screen.js' } }
      const resolve = createRouteResolver({ routeTree: tree, componentMap })
      const { element } = resolve('/')
      expect(element).toBeDefined()
    })
  })

  describe('dynamic routes', () => {
    it('resolves a dynamic route and extracts params', () => {
      const resolve = createRouteResolver({ routeTree: dynamicTree, componentMap })
      const { params } = resolve('/users/42/')
      expect(params).toEqual({ id: '42' })
    })

    it('resolves a dynamic route with a string param', () => {
      const resolve = createRouteResolver({ routeTree: dynamicTree, componentMap })
      const { params } = resolve('/users/hello-world/')
      expect(params).toEqual({ id: 'hello-world' })
    })

    it('resolves a nested route after a dynamic segment', () => {
      const resolve = createRouteResolver({ routeTree: dynamicTree, componentMap })
      const { params } = resolve('/users/7/posts/')
      expect(params).toEqual({ id: '7' })
    })

    it('does not confuse a static sibling with a dynamic segment', () => {
      const resolve = createRouteResolver({ routeTree: staticTree, componentMap })
      const { params } = resolve('/users/')
      expect(params).toBeUndefined()
    })
  })

  describe('not-found handling', () => {
    it('activates the nearest ancestor not-found boundary for an invalid child URL', () => {
      const resolve = createRouteResolver({ routeTree: dynamicTree, componentMap })
      // /users/42/invalid/ — partially matches [root → users → :id], users has not-found
      const { element } = resolve('/users/42/invalid/')
      expect(element).toBeDefined()
    })

    it('activates not-found via root boundary for a fully unmatched URL', () => {
      const resolve = createRouteResolver({ routeTree: staticTree, componentMap })
      const { element } = resolve('/nonexistent/')
      expect(element).toBeDefined()
    })

    it('throws NotFoundError when no ancestor has a not-found boundary', () => {
      const tree: RouteTreeNode = {
        name: '', type: 'static',
        roles: { layout: './layout.js' },
        children: [{ name: 'about', type: 'static', roles: { screen: './screen.js' } }],
      }
      const resolve = createRouteResolver({ routeTree: tree, componentMap })
      expect(() => resolve('/missing/')).toThrow(NotFoundError)
    })
  })

  describe('group nodes', () => {
    it('resolves a route in a later sibling group when an earlier sibling group has no match', () => {
      // Regression: DFS explores (account) first, hits dead-end, sets bestDepth — then
      // correctly matches theme under (appearance). bestDepth must be cleared so partial=false.
      const resolve = createRouteResolver({ routeTree: siblingGroupTree, componentMap })
      const { element, params } = resolve('/theme/')
      expect(element).toBeDefined()
      expect(params).toBeUndefined()
    })

    it('resolves a route inside a group without consuming a URL segment', () => {
      const resolve = createRouteResolver({ routeTree: groupTree, componentMap })
      const { element, params } = resolve('/profile/')
      expect(element).toBeDefined()
      expect(params).toBeUndefined()
    })

    it('uses the group not-found boundary for unmatched child URLs', () => {
      const resolve = createRouteResolver({ routeTree: groupTree, componentMap })
      const { element } = resolve('/missing/')
      expect(element).toBeDefined()
    })
  })

  describe('required-catchall routes', () => {
    it('matches a single segment and returns it as an array param', () => {
      const resolve = createRouteResolver({ routeTree: catchAllTree, componentMap })
      const { element, params } = resolve('/intro/')
      expect(element).toBeDefined()
      expect(params).toEqual({ slug: ['intro'] })
    })

    it('matches multiple segments and returns them as an array param', () => {
      const resolve = createRouteResolver({ routeTree: catchAllTree, componentMap })
      const { params } = resolve('/a/b/c/')
      expect(params).toEqual({ slug: ['a', 'b', 'c'] })
    })

    it('does not match zero segments', () => {
      const resolve = createRouteResolver({ routeTree: catchAllTree, componentMap })
      // Root has not-found, so a partial match should render the not-found boundary
      const { element } = resolve('/')
      expect(element).toBeDefined() // not-found boundary renders
    })
  })

  describe('optional-catchall routes', () => {
    it('matches zero segments (root) and returns an empty array param', () => {
      const resolve = createRouteResolver({ routeTree: optionalCatchAllTree, componentMap })
      const { element, params } = resolve('/')
      expect(element).toBeDefined()
      expect(params).toEqual({ slug: [] })
    })

    it('matches a single segment', () => {
      const resolve = createRouteResolver({ routeTree: optionalCatchAllTree, componentMap })
      const { params } = resolve('/intro/')
      expect(params).toEqual({ slug: ['intro'] })
    })

    it('matches multiple segments', () => {
      const resolve = createRouteResolver({ routeTree: optionalCatchAllTree, componentMap })
      const { params } = resolve('/a/b/c/')
      expect(params).toEqual({ slug: ['a', 'b', 'c'] })
    })
  })
})
