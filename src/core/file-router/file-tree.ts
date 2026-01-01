import { readdirSync, statSync } from 'fs'
import { resolve, join, posix } from 'path'
import { traverseBreadthFirst } from '@/lib/traversal'
import { DirectoryNotFoundError, NotADirectoryError } from '@/core/file-router/errors'

export type FileNode = { 
  name: string            // entry name (file or directory)
  path: string            // relative path like /app/home/screen.tsx
  children?: FileNode[]   // present only for directories
}

/**
 * Builds a file tree from a directory path.
 * 
 * @param appPath - Path to the app directory
 * @returns File tree structure
 * @throws {DirectoryNotFoundError} If the directory doesn't exist
 * @throws {NotADirectoryError} If the path is not a directory
 */
export function buildFileTree(appPath: string): FileNode {
  const rootPath = resolve(appPath)
  const stat = statSync(rootPath, { throwIfNoEntry: false })
  
  // Validation
  if (!stat)
    throw new DirectoryNotFoundError(rootPath)

  if (!stat.isDirectory()) 
    throw new NotADirectoryError(rootPath)
  
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
      if (!dirent.isFile() && !dirent.isDirectory()) 
        continue

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
