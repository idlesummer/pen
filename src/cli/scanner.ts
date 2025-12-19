import { readdirSync, statSync } from 'fs'
import { resolve, basename, join } from 'path'

export type FileTreeNode = { 
  name: string              // entry name (file or directory)
  path: string              // absolute filesystem path
  children?: FileTreeNode[] // present only for directories
}

export function scanDirTree(inputPath: string): FileTreeNode {
  const rootPath = resolve(inputPath)
  const stat = statSync(rootPath, { throwIfNoEntry: false })

  // Validation
  if (!stat)               throw new Error(`scanDir: path does not exist: ${rootPath}`)
  if (!stat.isDirectory()) throw new Error(`scanDir: expected directory, got non-directory: ${rootPath}`)

  // Breadth-first traversal of the directory tree
  const root: FileTreeNode = { name: basename(rootPath), path: rootPath, children: [] }
  const queue = [root]

  for (let head = 0; head < queue.length; head++) {
    const node = queue[head]
    const children = node.children! // directory nodes always have children

    // Read directory contents at node.path
    const dirents = readdirSync(node.path, { withFileTypes: true })
    dirents.sort((a, b) => a.name.localeCompare(b.name))

    for (const d of dirents) {
      const p = join(node.path, d.name)

      if (d.isDirectory()) {
        const child: FileTreeNode = { name: d.name, path: p, children: [] }
        children.push(child)
        queue.push(child)
      }
      else if (d.isFile()) {
        children.push({ name: d.name, path: p })
      }
    }
  }

  return root
}
