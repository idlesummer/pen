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
const pathComponentMap: PathComponentMap = {
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
  name: '',
  roles: { layout: './layout.js', 'not-found': './not-found.js' },
  children: [
    { name: 'about', roles: { screen: './screen.js' } },
    { name: 'users', roles: { screen: './screen.js' } },
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
  name: '',
  roles: { layout: './layout.js' },
  children: [
    {
      name: 'users',
      roles: { screen: './screen.js', 'not-found': './not-found.js' },
      children: [
        {
          name: '[id]',
          param: 'id',
          roles: { screen: './screen.js' },
          children: [
            { name: 'posts', roles: { screen: './screen.js' } },
          ],
        },
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
  name: '',
  roles: { layout: './layout.js' },
  children: [
    {
      name: '(auth)',
      group: true,
      roles: { 'not-found': './not-found.js' },
      children: [
        { name: 'profile', roles: { screen: './screen.js' } },
      ],
    },
  ],
}

// ===== Tests =====

describe('createRouteResolver', () => {
  describe('static routes', () => {
    it('resolves a static route', () => {
      const resolve = createRouteResolver({ routeTree: staticTree, pathComponentMap })
      const { element, params } = resolve('/about/')
      expect(element).toBeDefined()
      expect(params).toBeUndefined()
    })

    it('caches resolved routes', () => {
      const resolve = createRouteResolver({ routeTree: staticTree, pathComponentMap })
      const first = resolve('/about/')
      const second = resolve('/about/')
      expect(first).toBe(second)
    })

    it('resolves the root route', () => {
      const tree: RouteTreeNode = { name: '', roles: { screen: './screen.js' } }
      const resolve = createRouteResolver({ routeTree: tree, pathComponentMap })
      const { element } = resolve('/')
      expect(element).toBeDefined()
    })
  })

  describe('dynamic routes', () => {
    it('resolves a dynamic route and extracts params', () => {
      const resolve = createRouteResolver({ routeTree: dynamicTree, pathComponentMap })
      const { params } = resolve('/users/42/')
      expect(params).toEqual({ id: '42' })
    })

    it('resolves a dynamic route with a string param', () => {
      const resolve = createRouteResolver({ routeTree: dynamicTree, pathComponentMap })
      const { params } = resolve('/users/hello-world/')
      expect(params).toEqual({ id: 'hello-world' })
    })

    it('resolves a nested route after a dynamic segment', () => {
      const resolve = createRouteResolver({ routeTree: dynamicTree, pathComponentMap })
      const { params } = resolve('/users/7/posts/')
      expect(params).toEqual({ id: '7' })
    })

    it('does not confuse a static sibling with a dynamic segment', () => {
      const resolve = createRouteResolver({ routeTree: staticTree, pathComponentMap })
      const { params } = resolve('/users/')
      expect(params).toBeUndefined()
    })
  })

  describe('not-found handling', () => {
    it('activates the nearest ancestor not-found boundary for an invalid child URL', () => {
      const resolve = createRouteResolver({ routeTree: dynamicTree, pathComponentMap })
      // /users/42/invalid/ — partially matches [root → users → :id], users has not-found
      const { element } = resolve('/users/42/invalid/')
      expect(element).toBeDefined()
    })

    it('activates not-found via root boundary for a fully unmatched URL', () => {
      const resolve = createRouteResolver({ routeTree: staticTree, pathComponentMap })
      const { element } = resolve('/nonexistent/')
      expect(element).toBeDefined()
    })

    it('throws NotFoundError when no ancestor has a not-found boundary', () => {
      const tree: RouteTreeNode = {
        name: '',
        roles: { layout: './layout.js' },
        children: [{ name: 'about', roles: { screen: './screen.js' } }],
      }
      const resolve = createRouteResolver({ routeTree: tree, pathComponentMap })
      expect(() => resolve('/missing/')).toThrow(NotFoundError)
    })
  })

  describe('group nodes', () => {
    it('resolves a route inside a group without consuming a URL segment', () => {
      const resolve = createRouteResolver({ routeTree: groupTree, pathComponentMap })
      const { element, params } = resolve('/profile/')
      expect(element).toBeDefined()
      expect(params).toBeUndefined()
    })

    it('uses the group not-found boundary for unmatched child URLs', () => {
      const resolve = createRouteResolver({ routeTree: groupTree, pathComponentMap })
      const { element } = resolve('/missing/')
      expect(element).toBeDefined()
    })
  })
})
