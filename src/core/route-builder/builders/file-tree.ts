import { readdirSync, statSync } from 'fs'
import { resolve, join, posix } from 'path'
import { traverseBreadthFirst } from '@/lib/tree-utils'
import { DirectoryNotFoundError, NotADirectoryError } from '../errors'

export type FileNode = {
  name: string          // dirent name
  relPath: string
  absPath: string
  children?: FileNode[] // present only for directories
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

  // Root node
  const root: FileNode = {
    name: 'app',
    relPath: '/app',
    absPath: rootPath,
    children: [],
  }

  function expand(parentFile: FileNode) {
    const dirents = readdirSync(parentFile.absPath, { withFileTypes: true })
    const children: FileNode[] = []

    for (const dirent of dirents) {
      if (!dirent.isFile() && !dirent.isDirectory())  // Traverse only dirs and files
        continue

      const relPath = posix.join(parentFile.relPath, dirent.name)
      const absPath = join(parentFile.absPath, dirent.name)

      const child: FileNode = dirent.isDirectory()
        ? { name: dirent.name, relPath, absPath, children: [] }
        : { name: dirent.name, relPath, absPath }
      children.push(child)
    }
    return children.sort((a, b) => a.name.localeCompare(b.name))
  }

  return traverseBreadthFirst({
    root,
    expand,
    attach: (child, parent) => parent.children!.push(child),
    filter: (file) => file.children !== undefined,
  })
}
