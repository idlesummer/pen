import { readdirSync, statSync, type Dirent } from 'fs'
import { resolve, join, posix } from 'path'
import { traverse } from '@/lib/tree'
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
  const absPath = resolve(appPath)
  validateDirectory(absPath)

  // Root node
  const name = 'app'
  const relPath = '/app'
  const root: FileNode = { name, relPath, absPath, children: [] }

  traverse(root, {
    attach: (child, parent) => parent.children!.push(child),
    expand: (parentFile) => {
      if (!parentFile.children) return []

      return readdirSync(parentFile.absPath, { withFileTypes: true })
        .filter(d => d.isFile() || d.isDirectory())
        .map(d => createFileNode(d, parentFile))
        .sort((a, b) => a.name.localeCompare(b.name))
    },
  })
  return root
}

/** Validates that the path exists and is a directory. */
function validateDirectory(path: string) {
  const stat = statSync(path, { throwIfNoEntry: false })
  if (!stat) throw new DirectoryNotFoundError(path)
  if (!stat.isDirectory()) throw new NotADirectoryError(path)
}

function createFileNode(dirent: Dirent, parent: FileNode) {
  const relPath = posix.join(parent.relPath, dirent.name)
  const absPath = join(parent.absPath, dirent.name)

  return dirent.isDirectory()
    ? { name: dirent.name, relPath, absPath, children: [] }
    : { name: dirent.name, relPath, absPath }
}
