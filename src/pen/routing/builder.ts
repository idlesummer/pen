import { statSync } from 'fs'
import { resolve } from 'path'
import { traverse } from '@/pen/lib/tree'
import * as Segment from './internals/segment'
import Route from './internals/route'
import { DirectoryNotFoundError, NotADirectoryError } from './errors'

export function buildRouteTree(appPath: string): Route {
  const absPath = resolve(appPath)
  validateDirectory(absPath)

  const root = new Route(absPath, Segment.from(''))
  traverse(root, {
    visit: (route) => route.loadModules(),
    expand: (route) => route.getChildren(),
    attach: (child, parent) => parent.addChild(child),
  })

  return root
}

function validateDirectory(path: string): void {
  const stat = statSync(path, { throwIfNoEntry: false })
  if (!stat) throw new DirectoryNotFoundError(path)
  if (!stat.isDirectory()) throw new NotADirectoryError(path)
}
