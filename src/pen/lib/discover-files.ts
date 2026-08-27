import { readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { traverse } from './traverse'

type FsNode = {
  path: string
  isDirectory: boolean
}

function readChildren(dirPath: string): FsNode[] {
  return readdirSync(dirPath, { withFileTypes: true }).map(dirent => ({
    path: join(dirPath, dirent.name),
    isDirectory: dirent.isDirectory(),
  }))
}

/** Recursively collects every file under `dir` whose name ends with
 *  `extension`, as paths relative to `dir`. */
export function discoverFiles(dir: string, extension: string): string[] {
  const filePaths: string[] = []

  traverse<FsNode>({ path: dir, isDirectory: true }, {
    expand: node => node.isDirectory ? readChildren(node.path) : [],
    visit: (node) => {
      if (!node.isDirectory && node.path.endsWith(extension))
        filePaths.push(relative(dir, node.path))
    },
  })
  return filePaths.sort()
}
