import type { Endpoint, PositionNode } from '@/pen-core'
import type { ComponentMap } from '../modules/component-map'
import { describe, expect, test } from 'vitest'
import { validateComponentExports, validateAsyncPages } from '../diagnostics/validate'

function emptyComponentMap(): ComponentMap {
  return { page: {}, layout: {}, loading: {}, error: {}, fallback: {} }
}

function endpoint(contentPath: string, frames: { loading?: string }[] = []): Endpoint<PositionNode> {
  return { contentPath, frames: frames as Endpoint<PositionNode>['frames'], params: [] }
}

describe('validateComponentExports', () => {
  test('flags a non-function default export', () => {
    const componentMap = emptyComponentMap()
    componentMap.page['bad.tsx'] = 'not a component' as unknown as ComponentMap['page'][string]
    expect(validateComponentExports(componentMap).some(d => d.rule === 'invalid-component-export')).toBe(true)
  })

  test('warns on an anonymous or lowercase-named component', () => {
    const componentMap = emptyComponentMap()
    componentMap.page['lower.tsx'] = function lowerCase() {} as unknown as ComponentMap['page'][string]
    const diagnostic = validateComponentExports(componentMap).find(d => d.rule === 'unnamed-component-export')
    expect(diagnostic?.severity).toBe('warn')
  })

  test('does not flag a properly capitalized component', () => {
    const componentMap = emptyComponentMap()
    componentMap.page['good.tsx'] = function GoodPage() {} as unknown as ComponentMap['page'][string]
    expect(validateComponentExports(componentMap)).toEqual([])
  })
})

describe('validateAsyncPages', () => {
  test('flags an async page with no loading.tsx in its frame chain', () => {
    const componentMap = emptyComponentMap()
    componentMap.page['async.tsx'] = (async function AsyncPage() {}) as unknown as ComponentMap['page'][string]
    const diagnostics = validateAsyncPages([endpoint('async.tsx', [{}])], componentMap)
    expect(diagnostics.some(d => d.rule === 'async-page-missing-loading')).toBe(true)
  })

  test('does not flag an async page that has a loading.tsx in its frame chain', () => {
    const componentMap = emptyComponentMap()
    componentMap.page['async.tsx'] = (async function AsyncPage() {}) as unknown as ComponentMap['page'][string]
    const diagnostics = validateAsyncPages([endpoint('async.tsx', [{ loading: 'loading.tsx' }])], componentMap)
    expect(diagnostics).toEqual([])
  })

  test('does not flag a synchronous page regardless of loading.tsx', () => {
    const componentMap = emptyComponentMap()
    componentMap.page['sync.tsx'] = (function SyncPage() {}) as unknown as ComponentMap['page'][string]
    const diagnostics = validateAsyncPages([endpoint('sync.tsx', [{}])], componentMap)
    expect(diagnostics).toEqual([])
  })

  test('falls back to the fallback map when the content path is not a page', () => {
    const componentMap = emptyComponentMap()
    componentMap.fallback['fallback.tsx'] = (async function AsyncFallback() {}) as unknown as ComponentMap['fallback'][string]
    const diagnostics = validateAsyncPages([endpoint('fallback.tsx', [{}])], componentMap)
    expect(diagnostics.some(d => d.rule === 'async-page-missing-loading')).toBe(true)
  })
})
