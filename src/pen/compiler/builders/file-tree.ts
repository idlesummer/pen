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
export function createFileTree(appPath: string): FileNode {
  const absPath = resolve(appPath)
  validateDirectory(absPath)

  // Root node
  const name = 'app'
  const relPath = '/app'
  const root: FileNode = { name, relPath, absPath, children: [] }

  traverse(root, {
    expand: (file) => {
      return !file.children ? [] :
        readdirSync(file.absPath, { withFileTypes: true })
          .filter(dirent => dirent.isFile() || dirent.isDirectory())
          .map(dirent => createFileNode(dirent, file))
          .sort((a, b) => a.name.localeCompare(b.name))
    },
    attach: (child, parent) =>
      (parent.children!.push(child)),
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
  const name = dirent.name
  const relPath = posix.join(parent.relPath, name)
  const absPath = join(parent.absPath, name)

  return dirent.isDirectory()
    ? { name, relPath, absPath, children: [] }
    : { name, relPath, absPath }
}
