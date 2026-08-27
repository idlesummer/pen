import { readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { traverse } from '@/pen/lib/traverse'

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

/** Recursively collects every `.tsx` file under `appDir`, as paths relative
 *  to it - the same separator `createRouteTree` splits nested routes on. */
export function discoverRoutes(appDir: string): string[] {
  const filePaths: string[] = []

  traverse<FsNode>({ path: appDir, isDirectory: true }, {
    expand: node => node.isDirectory ? readChildren(node.path) : [],
    visit: (node) => {
      if (!node.isDirectory && node.path.endsWith('.tsx'))
        filePaths.push(relative(appDir, node.path))
    },
  })
  return filePaths.sort()
}
