import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { transform } from '../../pipeline'
import {
  FileRouterError,
  RouteValidationErrors,
  ConflictingCatchallError,
  ConflictingDynamicSegmentsError,
  DuplicateCatchallError,
  DuplicateOptionalCatchallError,
  SplatIndexConflictError,
} from '../../errors'

function expectValidationError<T extends FileRouterError>(
  fn: () => unknown,
  ErrorClass: new (...args: any[]) => T,
) {
  try {
    fn()
    expect.fail(`Expected ${ErrorClass.name} to be thrown`)
  } catch (e) {
    expect(e).toBeInstanceOf(RouteValidationErrors)
    expect((e as RouteValidationErrors).errors.some(err => err instanceof ErrorClass)).toBe(true)
  }
}

let appDir: string
let outDir: string
let tmp: string

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'pen-test-'))
  appDir = join(tmp, 'app')
  outDir = join(tmp, 'out')
  mkdirSync(appDir)
  mkdirSync(outDir)
})

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true })
})

/** Create a directory (and all parents) under appDir. */
function dir(...parts: string[]) {
  mkdirSync(join(appDir, ...parts), { recursive: true })
}

/** Create an empty file under appDir. */
function file(...parts: string[]) {
  const p = join(appDir, ...parts)
  mkdirSync(join(p, '..'), { recursive: true })
  writeFileSync(p, '')
}

function build() {
  return transform(appDir, outDir).routeTree
}


describe('buildRouteTree — dynamic routes', () => {
  it('detects a [param] directory and sets type=dynamic + param name', () => {
    dir('[id]')
    file('[id]', 'screen.tsx')

    const tree = build()
    const child = tree.children![0]!

    expect(child.type).toBe('dynamic')
    expect(child.param).toBe('id')
  })

  it('produces both static and dynamic children as siblings', () => {
    dir('[id]');  file('[id]', 'screen.tsx')
    dir('about'); file('about', 'screen.tsx')

    const tree = build()
    const children = tree.children!

    expect(children).toHaveLength(2)
    expect(children.some(c => c.type === 'static' && c.name === 'about')).toBe(true)
    expect(children.some(c => c.type === 'dynamic' && c.name === '[id]')).toBe(true)
  })

  it('supports nested dynamic segments', () => {
    dir('users', '[userId]', 'posts', '[postId]')
    file('users', '[userId]', 'posts', '[postId]', 'screen.tsx')

    const tree = build()
    const users  = tree.children![0]!
    const userId = users.children![0]!
    const posts  = userId.children![0]!
    const postId = posts.children![0]!

    expect(userId.type).toBe('dynamic')
    expect(userId.param).toBe('userId')
    expect(postId.type).toBe('dynamic')
    expect(postId.param).toBe('postId')
  })

  it('leaves static segments unchanged', () => {
    dir('about')
    file('about', 'screen.tsx')

    const tree = build()
    const about = tree.children![0]!

    expect(about.type).toBe('static')
    expect(about.param).toBeUndefined()
  })
})


describe('buildRouteTree — catchall routes', () => {
  it('detects a [...param] directory and sets type=required-catchall + param name', () => {
    dir('[...slug]')
    file('[...slug]', 'screen.tsx')

    const tree = build()
    const catchAll = tree.children![0]!

    expect(catchAll.type).toBe('required-catchall')
    expect(catchAll.param).toBe('slug')
  })

  it('detects a [[...param]] directory and sets type=optional-catchall + param name', () => {
    dir('[[...slug]]')
    file('[[...slug]]', 'screen.tsx')

    const tree = build()
    const optionalCatchAll = tree.children![0]!

    expect(optionalCatchAll.type).toBe('optional-catchall')
    expect(optionalCatchAll.param).toBe('slug')
  })

  it('sorts children: static < dynamic < required-catchall', () => {
    file('[...slug]', 'screen.tsx')
    file('[id]', 'screen.tsx')
    file('about', 'screen.tsx')

    const tree = build()
    expect(tree.children!.map(c => c.type)).toEqual(['static', 'dynamic', 'required-catchall'])
  })

  it('sorts children: dynamic < optional-catchall', () => {
    file('[[...opt]]', 'screen.tsx')
    file('[id]', 'screen.tsx')

    const tree = build()
    expect(tree.children!.map(c => c.type)).toEqual(['dynamic', 'optional-catchall'])
  })
})


describe('buildRouteTree — group validation', () => {
  it('throws ConflictingDynamicSegmentsError when two groups expose the same dynamic param', () => {
    file('(a)', '[id]', 'screen.tsx')
    file('(b)', '[slug]', 'screen.tsx')

    expectValidationError(build, ConflictingDynamicSegmentsError)
  })

  it('throws DuplicateCatchallError when two groups both expose a required-catchall', () => {
    file('(a)', '[...slug]', 'screen.tsx')
    file('(b)', '[...slug]', 'screen.tsx')

    expectValidationError(build, DuplicateCatchallError)
  })

  it('throws ConflictingCatchallError when groups expose both required- and optional-catchall', () => {
    file('(a)', '[...slug]', 'screen.tsx')
    file('(b)', '[[...slug]]', 'screen.tsx')

    expectValidationError(build, ConflictingCatchallError)
  })

  it('throws DuplicateOptionalCatchallError when two groups both expose an optional-catchall', () => {
    file('(a)', '[[...slug]]', 'screen.tsx')
    file('(b)', '[[...slug]]', 'screen.tsx')

    expectValidationError(build, DuplicateOptionalCatchallError)
  })

  it('throws SplatIndexConflictError when a group exposes an optional-catchall alongside a static sibling', () => {
    file('(a)', '[[...slug]]', 'screen.tsx')
    file('about', 'screen.tsx')

    expectValidationError(build, SplatIndexConflictError)
  })

  it('detects conflicts through nested groups', () => {
    file('(a)', '(b)', '[id]', 'screen.tsx')
    file('(c)', '[slug]', 'screen.tsx')

    expectValidationError(build, ConflictingDynamicSegmentsError)
  })

  it('allows non-conflicting children across sibling groups', () => {
    dir('(a)', 'profile')
    dir('(b)', 'settings')

    expect(build).not.toThrow()
  })
})
