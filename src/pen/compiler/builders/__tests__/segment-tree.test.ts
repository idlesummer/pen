import { describe, it, expect } from 'vitest'
import type { FileNode } from '../file-tree'
import { createSegmentTree } from '../segment-tree'

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

  it('uses :param notation in the URL pattern', () => {
    const appDir = dir('app', '/app', [
      dir('[slug]', '/app/[slug]', [file('screen.tsx', '/app/[slug]/screen.tsx')]),
    ])

    const tree = createSegmentTree(appDir)
    const dynamicChild = tree.children![0]!

    expect(dynamicChild.route).toBe('/:slug/')
  })

  it('produces both static and dynamic children as siblings', () => {
    const appDir = dir('app', '/app', [
      dir('[id]', '/app/[id]', [file('screen.tsx', '/app/[id]/screen.tsx')]),
      dir('about', '/app/about', [file('screen.tsx', '/app/about/screen.tsx')]),
    ])

    const tree = createSegmentTree(appDir)
    const children = tree.children!

    expect(children).toHaveLength(2)
    expect(children.some(c => c.type === 'page' && c.name === 'about')).toBe(true)
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
    expect(userId.route).toBe('/users/:userId/')

    expect(postId.type).toBe('dynamic')
    expect(postId.param).toBe('postId')
    expect(postId.route).toBe('/users/:userId/posts/:postId/')
  })

  it('leaves static segments unchanged', () => {
    const appDir = dir('app', '/app', [
      dir('about', '/app/about', [file('screen.tsx', '/app/about/screen.tsx')]),
    ])

    const tree = createSegmentTree(appDir)
    const about = tree.children![0]!

    expect(about.type).toBe('page')
    expect(about.param).toBeUndefined()
    expect(about.route).toBe('/about/')
  })
})
