import { readdirSync, statSync, type Dirent } from 'fs'
import { resolve, basename, join } from 'path'
import { buildTreeBFS } from '@/lib/tree-builder'

export type FileTreeNode = { 
  name: string              // entry name (file or directory)
  path: string              // absolute filesystem path
  children?: FileTreeNode[] // present only for directories
}

export function buildFileTree(inputPath: string): FileTreeNode {
  const rootPath = resolve(inputPath)
  const stat = statSync(rootPath, { throwIfNoEntry: false })
  if (!stat)               throw new Error(`buildFileTree: path does not exist: ${rootPath}`)
  if (!stat.isDirectory()) throw new Error(`buildFileTree: expected directory, got: ${rootPath}`)

  return buildTreeBFS<FileTreeNode, Dirent>({
    root: { name: basename(rootPath), path: rootPath, children: [] },

    expand: (node) => {
      const dirents = readdirSync(node.path, { withFileTypes: true })
      return dirents
        .filter(d => d.isFile() || d.isDirectory())
        .sort((a, b) => a.name.localeCompare(b.name))
    },

    createChild: (dirent, parent) => {
      const path = join(parent.path, dirent.name)
      return dirent.isDirectory()
        ? { name: dirent.name, path, children: [] }
        : { name: dirent.name, path }
    },

    attach: (child, parent) => parent.children!.push(child),
    shouldTraverse: (child) => child.children !== undefined,
  })
}
