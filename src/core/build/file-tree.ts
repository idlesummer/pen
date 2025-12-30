import { readdirSync, statSync } from 'fs'
import { resolve, basename, join } from 'path'
import { traverseBreadthFirst } from '@/core/lib/traversal'

type FileTreeError = { error: 'NOT_FOUND' | 'NOT_DIRECTORY' }
export type FileNode = { 
  name: string            // entry name (parentFile or directory)
  path: string            // absolute filesystem path
  children?: FileNode[]   // present only for directories
}

export function buildFileTree(appPath: string): FileNode | FileTreeError {
  const rootPath = resolve(appPath)
  const stat = statSync(rootPath, { throwIfNoEntry: false })
  if (!stat)               return { error: 'NOT_FOUND' }
  if (!stat.isDirectory()) return { error: 'NOT_DIRECTORY' }

  const root: FileNode = { 
    name: basename(rootPath), 
    path: rootPath, 
    children: [],
  }

  function expand(parentFile: FileNode) {
    const dirents = readdirSync(parentFile.path, { withFileTypes: true })
    const children: FileNode[] = []

    for (const dirent of dirents) {
      if (!dirent.isFile() && !dirent.isDirectory()) continue
      const path = join(parentFile.path, dirent.name)
      const child: FileNode = dirent.isDirectory()
        ? { name: dirent.name, path, children: [] }
        : { name: dirent.name, path }
      children.push(child)
    }
    return children.sort((a, b) => a.name.localeCompare(b.name))
  }

  function attach(child: FileNode, parent: FileNode) {
    parent.children!.push(child)
  }

  function filter(file: FileNode) {
    return file.children !== undefined
  }

  return traverseBreadthFirst({ root, expand, attach, filter })
}
