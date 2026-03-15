import { describe, it, expect } from 'vitest'
import { matchDynamicRoutePattern } from '../resolver'

const toSegments = (url: string) => url.slice(1, -1).split('/')

describe('matchDynamicRoutePattern', () => {
  describe('exact-length mismatches', () => {
    it('returns null when URL has more segments than pattern', () => {
      expect(matchDynamicRoutePattern(toSegments('/users/42/posts/'), toSegments('/users/:id/'))).toBeNull()
    })

    it('returns null when URL has fewer segments than pattern', () => {
      expect(matchDynamicRoutePattern(toSegments('/users/'), toSegments('/users/:id/'))).toBeNull()
    })
  })

  describe('static segment conflicts', () => {
    it('returns null when a static segment does not match', () => {
      expect(matchDynamicRoutePattern(toSegments('/admins/42/'), toSegments('/users/:id/'))).toBeNull()
    })
  })

  describe('single dynamic segment', () => {
    it('extracts a simple param', () => {
      expect(matchDynamicRoutePattern(toSegments('/users/42/'), toSegments('/users/:id/'))).toEqual({ id: '42' })
    })

    it('extracts a string param', () => {
      expect(matchDynamicRoutePattern(toSegments('/posts/hello-world/'), toSegments('/posts/:slug/'))).toEqual({ slug: 'hello-world' })
    })
  })

  describe('multiple dynamic segments', () => {
    it('extracts multiple params in order', () => {
      expect(matchDynamicRoutePattern(toSegments('/users/7/posts/99/'), toSegments('/users/:userId/posts/:postId/'))).toEqual({ userId: '7', postId: '99' })
    })

    it('returns null if one static segment does not match', () => {
      expect(matchDynamicRoutePattern(toSegments('/users/7/comments/99/'), toSegments('/users/:userId/posts/:postId/'))).toBeNull()
    })
  })

  describe('no dynamic segments', () => {
    it('returns null for a fully static pattern', () => {
      expect(matchDynamicRoutePattern(toSegments('/about/'), toSegments('/about/'))).toBeNull()
    })
  })
})
