import { describe, expect, test } from 'vitest'
import { GLOBAL_DEFAULT, GLOBAL_ERROR, MODULE_ROLES } from '../compiler/route/route-module'

describe('MODULE_ROLES', () => {
  test('contains exactly the known route module roles', () => {
    expect(MODULE_ROLES).toEqual(new Set(['page', 'layout', 'loading', 'error', 'fallback']))
  })
})

describe('sentinels', () => {
  test('GLOBAL_DEFAULT and GLOBAL_ERROR are distinct', () => {
    expect(GLOBAL_DEFAULT).not.toBe(GLOBAL_ERROR)
  })

  test('sentinels cannot collide with a real file path', () => {
    // Both start with a NUL byte, which can never appear in a real file path
    expect(GLOBAL_DEFAULT.startsWith('\0')).toBe(true)
    expect(GLOBAL_ERROR.startsWith('\0')).toBe(true)
  })
})
