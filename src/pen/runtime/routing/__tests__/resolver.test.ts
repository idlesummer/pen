import { describe, it, expect } from 'vitest'
import { matchDynamic } from '../resolver'

describe('matchDynamic', () => {
  describe('exact-length mismatches', () => {
    it('returns null when URL has more segments than pattern', () => {
      expect(matchDynamic('/users/42/posts/', '/users/:id/', ['id'])).toBeNull()
    })

    it('returns null when URL has fewer segments than pattern', () => {
      expect(matchDynamic('/users/', '/users/:id/', ['id'])).toBeNull()
    })
  })

  describe('static segment conflicts', () => {
    it('returns null when a static segment does not match', () => {
      expect(matchDynamic('/admins/42/', '/users/:id/', ['id'])).toBeNull()
    })

    it('returns null when paramName is not in paramNames list', () => {
      expect(matchDynamic('/users/42/', '/users/:id/', [])).toBeNull()
    })
  })

  describe('single dynamic segment', () => {
    it('extracts a simple param', () => {
      expect(matchDynamic('/users/42/', '/users/:id/', ['id'])).toEqual({ id: '42' })
    })

    it('extracts a string param', () => {
      expect(matchDynamic('/posts/hello-world/', '/posts/:slug/', ['slug'])).toEqual({
        slug: 'hello-world',
      })
    })

    it('URL-decodes param values', () => {
      expect(matchDynamic('/tags/hello%20world/', '/tags/:name/', ['name'])).toEqual({
        name: 'hello world',
      })
    })
  })

  describe('multiple dynamic segments', () => {
    it('extracts multiple params in order', () => {
      expect(
        matchDynamic('/users/7/posts/99/', '/users/:userId/posts/:postId/', ['userId', 'postId']),
      ).toEqual({ userId: '7', postId: '99' })
    })

    it('returns null if one static segment does not match', () => {
      expect(
        matchDynamic('/users/7/comments/99/', '/users/:userId/posts/:postId/', ['userId', 'postId']),
      ).toBeNull()
    })
  })

  describe('no dynamic segments', () => {
    it('returns null for a fully static pattern with 0 params', () => {
      expect(matchDynamic('/about/', '/about/', [])).toBeNull()
    })
  })
})
