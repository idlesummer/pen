import { describe, expect, test } from 'vitest'
import { createNavigation, push, replace, back, forward, refresh } from '../view/navigation/navigation-core'

describe('createNavigation', () => {
  test('starts with a single history entry at position 0', () => {
    expect(createNavigation('/')).toEqual({ history: ['/'], position: 0, refreshes: 0 })
  })
})

describe('push', () => {
  test('appends a route and moves to it', () => {
    const state = createNavigation('/')
    push(state, '/about')
    expect(state.history).toEqual(['/', '/about'])
    expect(state.position).toBe(1)
  })

  test('truncates discarded forward history before pushing', () => {
    const state = createNavigation('/')
    push(state, '/a')
    push(state, '/b')
    back(state) // position back to '/a'
    push(state, '/c')
    expect(state.history).toEqual(['/', '/a', '/c'])
    expect(state.position).toBe(2)
  })

  test('caps history length and keeps position pointing at the newest entry', () => {
    const state = createNavigation('/')
    for (let i = 0; i < 600; i++)
      push(state, `/${i}`)

    expect(state.history.length).toBe(500) // mirrors navigation-core.ts's own HISTORY_LIMIT
    expect(state.position).toBe(state.history.length - 1)
    expect(state.history.at(-1)).toBe('/599')
  })
})

describe('replace', () => {
  test('overwrites only the current entry, leaving position and the rest of history untouched', () => {
    const state = createNavigation('/')
    push(state, '/about')
    replace(state, '/about-us')
    expect(state.history).toEqual(['/', '/about-us'])
    expect(state.position).toBe(1)
  })
})

describe('back', () => {
  test('moves back and returns true when not at the start', () => {
    const state = createNavigation('/')
    push(state, '/about')
    expect(back(state)).toBe(true)
    expect(state.position).toBe(0)
  })

  test('is a no-op and returns false at the start of history', () => {
    const state = createNavigation('/')
    expect(back(state)).toBe(false)
    expect(state.position).toBe(0)
  })
})

describe('forward', () => {
  test('moves forward and returns true when not at the end', () => {
    const state = createNavigation('/')
    push(state, '/about')
    back(state)
    expect(forward(state)).toBe(true)
    expect(state.position).toBe(1)
  })

  test('is a no-op and returns false at the end of history', () => {
    const state = createNavigation('/')
    push(state, '/about')
    expect(forward(state)).toBe(false)
    expect(state.position).toBe(1)
  })
})

describe('refresh', () => {
  test('increments refreshes without touching history or position', () => {
    const state = createNavigation('/')
    push(state, '/about')
    refresh(state)
    expect(state.refreshes).toBe(1)
    expect(state.history).toEqual(['/', '/about'])
    expect(state.position).toBe(1)
  })
})
