import { readdirSync, statSync } from 'fs'
import { resolve, basename, join } from 'path'
import { buildTreeBFS } from '@/lib/tree-builder'

export type PathNode = { 
  name: string            // entry name (file or directory)
  path: string            // absolute filesystem path
  children?: PathNode[]   // present only for directories
}

export function buildFileTree(inputPath: string): PathNode {
  const rootPath = resolve(inputPath)
  const stat = statSync(rootPath, { throwIfNoEntry: false })
  if (!stat)               throw new Error(`buildFileTree: path does not exist: ${rootPath}`)
  if (!stat.isDirectory()) throw new Error(`buildFileTree: expected directory, got: ${rootPath}`)

  return buildTreeBFS<PathNode>({
    // Starting node
    root: { name: basename(rootPath), path: rootPath, children: [] },

    // Read directory and create child PathNodes
    expand: (node) => {
      return readdirSync(node.path, { withFileTypes: true })
        .filter(d => d.isFile() || d.isDirectory())
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((dirent) => {
          const path = join(node.path, dirent.name)
          return dirent.isDirectory()
            ? { name: dirent.name, path, children: [] }
            : { name: dirent.name, path }
        })
    },

    // Add child to parent's children array
    attach: (child, parent) => parent.children!.push(child),

    // Only traverse directories (skip files)
    filter: (child) => child.children !== undefined,
  })
}
