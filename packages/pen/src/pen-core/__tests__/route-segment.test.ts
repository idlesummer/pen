import { describe, expect, test } from 'vitest'
import { createSegment, isPrivate, isUrlConsuming, isDynamicOrCatchall, isBoundary } from '../compiler/route/route-segment'

describe('createSegment', () => {
  test('root', () => {
    expect(createSegment('')).toEqual({ type: 'root', segment: '' })
  })

  test('static', () => {
    expect(createSegment('blog')).toEqual({ type: 'static', segment: 'blog' })
  })

  test('dynamic', () => {
    expect(createSegment('[id]')).toEqual({ type: 'dynamic', segment: 'id' })
  })

  test('catchall', () => {
    expect(createSegment('[...slug]')).toEqual({ type: 'catchall', segment: 'slug' })
  })

  test('group', () => {
    expect(createSegment('(marketing)')).toEqual({ type: 'group', segment: 'marketing' })
  })

  test('slot', () => {
    expect(createSegment('@modal')).toEqual({ type: 'slot', segment: 'modal' })
  })

  test('malformed: empty slot name', () => {
    expect(createSegment('@').type).toBe('malformed')
  })

  test('malformed: invalid dynamic param name', () => {
    expect(createSegment('[123]').type).toBe('malformed')
  })

  test('malformed: invalid catchall param name', () => {
    expect(createSegment('[...123]').type).toBe('malformed')
  })

  test('malformed: stray bracket', () => {
    expect(createSegment('foo]bar').type).toBe('malformed')
  })
})

describe('helpers', () => {
  test('isPrivate', () => {
    expect(isPrivate('_lib')).toBe(true)
    expect(isPrivate('lib')).toBe(false)
  })

  test('isUrlConsuming', () => {
    expect(isUrlConsuming('static')).toBe(true)
    expect(isUrlConsuming('group')).toBe(false)
  })

  test('isDynamicOrCatchall', () => {
    expect(isDynamicOrCatchall('dynamic')).toBe(true)
    expect(isDynamicOrCatchall('static')).toBe(false)
  })

  test('isBoundary', () => {
    expect(isBoundary('root')).toBe(true)
    expect(isBoundary('slot')).toBe(true)
    expect(isBoundary('static')).toBe(false)
  })
})
