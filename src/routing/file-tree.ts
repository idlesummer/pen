import { readdirSync, statSync } from 'fs'
import { resolve, basename, join } from 'path'
import { traverseBreadthFirst } from '@/lib/traversal'

export type FileNode = { 
  name: string            // entry name (parentFile or directory)
  path: string            // absolute filesystem path
  children?: FileNode[]   // present only for directories
}

export function buildFileTree(appPath: string): FileNode {
  const rootPath = resolve(appPath)
  const stat = statSync(rootPath, { throwIfNoEntry: false })
  if (!stat)               throw new Error(`buildFileTree: path does not exist: ${rootPath}`)
  if (!stat.isDirectory()) throw new Error(`buildFileTree: expected directory, got: ${rootPath}`)

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

  function filter(child: FileNode) {
    return child.children !== undefined
  }

  return traverseBreadthFirst({ root, expand, attach, filter })
}
