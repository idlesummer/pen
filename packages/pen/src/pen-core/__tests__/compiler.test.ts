import { describe, expect, test } from 'vitest'
import { compileApp } from '../compiler/compiler'
import { GLOBAL_DEFAULT, GLOBAL_ERROR } from '../compiler/route/route-module'

describe('compileApp', () => {
  test('compiles a simple app with no diagnostics', () => {
    const output = compileApp(['page.tsx'])
    expect(output.diagnostics).toEqual([])
    // The root boundary's own frame always carries the error/fallback sentinels.
    expect(output.modulePaths).toEqual([GLOBAL_DEFAULT, GLOBAL_ERROR, 'page.tsx'])
    expect(output.pageEndpoints).toHaveLength(1)
    expect(output.positionTree.endpoint?.contentPath).toBe('page.tsx')
  })

  test('surfaces route-tree diagnostics', () => {
    const output = compileApp(['[bad name]/page.tsx'])
    expect(output.diagnostics.some(d => d.rule === 'malformed-segment')).toBe(true)
  })

  test('surfaces position-conflict diagnostics', () => {
    const output = compileApp(['(a)/page.tsx', '(b)/page.tsx'])
    expect(output.diagnostics.some(d => d.rule === 'duplicate-page-route')).toBe(true)
  })
})
