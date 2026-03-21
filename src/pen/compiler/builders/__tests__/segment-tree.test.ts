import { describe, it, expect } from 'vitest'
import type { FileNode } from '../file-tree'
import { createSegmentTree } from '../segment-tree'
import {
  ConflictingCatchallError,
  ConflictingDynamicSegmentsError,
  DuplicateCatchallError,
  DuplicateOptionalCatchallError,
  SplatIndexConflictError,
} from '../../errors'

/** Minimal helper to build a fake file-tree directory node. */
function dir(name: string, absPath: string, children: FileNode[] = []): FileNode {
  return { name, relPath: `/${name}`, absPath, children }
}

function file(name: string, absPath: string): FileNode {
  return { name, relPath: `/${name}`, absPath }
}

describe('createSegmentTree — dynamic routes', () => {
  it('detects a [param] directory and sets type=dynamic + param name', () => {
    const appDir = dir('app', '/app', [
      dir('[id]', '/app/[id]', [file('screen.tsx', '/app/[id]/screen.tsx')]),
    ])

    const tree = createSegmentTree(appDir)
    const dynamicChild = tree.children![0]!

    expect(dynamicChild.type).toBe('dynamic')
    expect(dynamicChild.param).toBe('id')
  })

  it('uses Next.js bracket notation in the URL pattern', () => {
    const appDir = dir('app', '/app', [
      dir('[slug]', '/app/[slug]', [file('screen.tsx', '/app/[slug]/screen.tsx')]),
    ])

    const tree = createSegmentTree(appDir)
    const dynamicChild = tree.children![0]!

    expect(dynamicChild.route).toBe('/[slug]/')
  })

  it('produces both static and dynamic children as siblings', () => {
    const appDir = dir('app', '/app', [
      dir('[id]', '/app/[id]', [file('screen.tsx', '/app/[id]/screen.tsx')]),
      dir('about', '/app/about', [file('screen.tsx', '/app/about/screen.tsx')]),
    ])

    const tree = createSegmentTree(appDir)
    const children = tree.children!

    expect(children).toHaveLength(2)
    expect(children.some(c => c.type === 'static' && c.name === 'about')).toBe(true)
    expect(children.some(c => c.type === 'dynamic' && c.name === '[id]')).toBe(true)
  })

  it('supports nested dynamic segments', () => {
    const appDir = dir('app', '/app', [
      dir('users', '/app/users', [
        dir('[userId]', '/app/users/[userId]', [
          dir('posts', '/app/users/[userId]/posts', [
            dir('[postId]', '/app/users/[userId]/posts/[postId]', [
              file('screen.tsx', '/app/users/[userId]/posts/[postId]/screen.tsx'),
            ]),
          ]),
        ]),
      ]),
    ])

    const tree = createSegmentTree(appDir)
    const users = tree.children![0]!
    const userId = users.children![0]!
    const posts = userId.children![0]!
    const postId = posts.children![0]!

    expect(userId.type).toBe('dynamic')
    expect(userId.param).toBe('userId')
    expect(userId.route).toBe('/users/[userId]/')

    expect(postId.type).toBe('dynamic')
    expect(postId.param).toBe('postId')
    expect(postId.route).toBe('/users/[userId]/posts/[postId]/')
  })

  it('leaves static segments unchanged', () => {
    const appDir = dir('app', '/app', [
      dir('about', '/app/about', [file('screen.tsx', '/app/about/screen.tsx')]),
    ])

    const tree = createSegmentTree(appDir)
    const about = tree.children![0]!

    expect(about.type).toBe('static')
    expect(about.param).toBeUndefined()
    expect(about.route).toBe('/about/')
  })
})

describe('createSegmentTree — catchall routes', () => {
  it('detects a [...param] directory and sets type=catchall + param name', () => {
    const appDir = dir('app', '/app', [
      dir('[...slug]', '/app/[...slug]', [file('screen.tsx', '/app/[...slug]/screen.tsx')]),
    ])

    const tree = createSegmentTree(appDir)
    const catchAll = tree.children![0]!

    expect(catchAll.type).toBe('required-catchall')
    expect(catchAll.param).toBe('slug')
  })

  it('uses Next.js bracket notation in the route pattern', () => {
    const appDir = dir('app', '/app', [
      dir('[...slug]', '/app/[...slug]', [file('screen.tsx', '/app/[...slug]/screen.tsx')]),
    ])

    const tree = createSegmentTree(appDir)
    expect(tree.children![0]!.route).toBe('/[...slug]/')
  })

  it('detects a [[...param]] directory and sets type=splat + param name', () => {
    const appDir = dir('app', '/app', [
      dir('[[...slug]]', '/app/[[...slug]]', [file('screen.tsx', '/app/[[...slug]]/screen.tsx')]),
    ])

    const tree = createSegmentTree(appDir)
    const optionalCatchAll = tree.children![0]!

    expect(optionalCatchAll.type).toBe('optional-catchall')
    expect(optionalCatchAll.param).toBe('slug')
  })

  it('sorts children: static < dynamic < required-catchall', () => {
    const appDir = dir('app', '/app', [
      dir('[...slug]',   '/app/[...slug]',   []),
      dir('[id]',        '/app/[id]',        []),
      dir('about',       '/app/about',       []),
    ])

    const tree = createSegmentTree(appDir)
    expect(tree.children!.map(c => c.type)).toEqual(['static', 'dynamic', 'required-catchall'])
  })

  it('sorts children: static < dynamic < optional-catchall', () => {
    const appDir = dir('app', '/app', [
      dir('[[...opt]]',  '/app/[[...opt]]',  []),
      dir('[id]',        '/app/[id]',        []),
    ])

    const tree = createSegmentTree(appDir)
    expect(tree.children!.map(c => c.type)).toEqual(['dynamic', 'optional-catchall'])
  })
})

describe('createSegmentTree — group validation', () => {
  it('throws ConflictingDynamicSegmentsError when two groups expose the same dynamic param', () => {
    const appDir = dir('app', '/app', [
      dir('(a)', '/app/(a)', [dir('[id]', '/app/(a)/[id]', [])]),
      dir('(b)', '/app/(b)', [dir('[slug]', '/app/(b)/[slug]', [])]),
    ])
    expect(() => createSegmentTree(appDir)).toThrow(ConflictingDynamicSegmentsError)
  })

  it('throws DuplicateCatchallError when two groups both expose a required-catchall', () => {
    const appDir = dir('app', '/app', [
      dir('(a)', '/app/(a)', [dir('[...slug]', '/app/(a)/[...slug]', [])]),
      dir('(b)', '/app/(b)', [dir('[...slug]', '/app/(b)/[...slug]', [])]),
    ])
    expect(() => createSegmentTree(appDir)).toThrow(DuplicateCatchallError)
  })

  it('throws ConflictingCatchallError when groups expose both required- and optional-catchall', () => {
    const appDir = dir('app', '/app', [
      dir('(a)', '/app/(a)', [dir('[...slug]',   '/app/(a)/[...slug]',   [])]),
      dir('(b)', '/app/(b)', [dir('[[...slug]]', '/app/(b)/[[...slug]]', [])]),
    ])
    expect(() => createSegmentTree(appDir)).toThrow(ConflictingCatchallError)
  })

  it('throws DuplicateOptionalCatchallError when two groups both expose an optional-catchall', () => {
    const appDir = dir('app', '/app', [
      dir('(a)', '/app/(a)', [dir('[[...slug]]', '/app/(a)/[[...slug]]', [])]),
      dir('(b)', '/app/(b)', [dir('[[...slug]]', '/app/(b)/[[...slug]]', [])]),
    ])
    expect(() => createSegmentTree(appDir)).toThrow(DuplicateOptionalCatchallError)
  })

  it('throws SplatIndexConflictError when a group exposes an optional-catchall alongside a static sibling', () => {
    const appDir = dir('app', '/app', [
      dir('(a)', '/app/(a)', [dir('[[...slug]]', '/app/(a)/[[...slug]]', [])]),
      dir('about', '/app/about', []),
    ])
    expect(() => createSegmentTree(appDir)).toThrow(SplatIndexConflictError)
  })

  it('detects conflicts through nested groups', () => {
    const appDir = dir('app', '/app', [
      dir('(a)', '/app/(a)', [
        dir('(b)', '/app/(a)/(b)', [dir('[id]', '/app/(a)/(b)/[id]', [])]),
      ]),
      dir('(c)', '/app/(c)', [dir('[slug]', '/app/(c)/[slug]', [])]),
    ])
    expect(() => createSegmentTree(appDir)).toThrow(ConflictingDynamicSegmentsError)
  })

  it('allows non-conflicting children across sibling groups', () => {
    const appDir = dir('app', '/app', [
      dir('(a)', '/app/(a)', [dir('profile', '/app/(a)/profile', [])]),
      dir('(b)', '/app/(b)', [dir('settings', '/app/(b)/settings', [])]),
    ])
    expect(() => createSegmentTree(appDir)).not.toThrow()
  })
})
