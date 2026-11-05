import { describe, expect, test } from 'vitest'
import { createRouter } from '../runtime/router'
import { GLOBAL_DEFAULT, GLOBAL_ERROR } from '../compiler/route/route-module'

describe('createRouter', () => {
  test('matches urls and exposes diagnostics and module paths', () => {
    const router = createRouter(['page.tsx', 'blog/page.tsx'])
    expect(router.diagnostics).toEqual([])
    expect(router.modulePaths).toEqual([GLOBAL_DEFAULT, GLOBAL_ERROR, 'blog/page.tsx', 'page.tsx'])
    expect(router.pageEndpoints).toHaveLength(2)

    const result = router.routeMatcher('/blog')
    expect(result.endpoint.contentPath).toBe('blog/page.tsx')
  })
})
