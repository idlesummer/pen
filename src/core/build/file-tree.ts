import { readdirSync, statSync } from 'fs'
import { resolve, join, posix } from 'path'
import { traverseBreadthFirst } from '@/lib/traversal'

type FileTreeError = { error: 'NOT_FOUND' | 'NOT_DIRECTORY' }

export type FileNode = { 
  name: string            // entry name (file or directory)
  path: string            // relative path like /app/home/screen.tsx
  children?: FileNode[]   // present only for directories
}

export function buildFileTree(appPath: string): FileNode | FileTreeError {
  const rootPath = resolve(appPath)
  const stat = statSync(rootPath, { throwIfNoEntry: false })
  if (!stat)               return { error: 'NOT_FOUND' }
  if (!stat.isDirectory()) return { error: 'NOT_DIRECTORY' }
  
  // Track absolute paths internally for filesystem operations
  const absPathMap: Record<string, string> = {}
  absPathMap['/app'] = rootPath

  // Root node
  const root: FileNode = { 
    name: 'app', 
    path: '/app', 
    children: [],
  }

  function expand(parentFile: FileNode) {
    const parentAbsPath = absPathMap[parentFile.path]!  // Always populated
    const dirents = readdirSync(parentAbsPath, { withFileTypes: true })
    const children: FileNode[] = []

    for (const dirent of dirents) {
      if (!dirent.isFile() && !dirent.isDirectory()) continue

      const relPath = posix.join(parentFile.path, dirent.name)
      const absPath = join(parentAbsPath, dirent.name)
      absPathMap[relPath] = absPath
      
      const child: FileNode = dirent.isDirectory()
        ? { name: dirent.name, path: relPath, children: [] }
        : { name: dirent.name, path: relPath }
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
