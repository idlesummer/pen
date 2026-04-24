import { statSync } from 'fs'
import { resolve } from 'path'
import { traverse } from '@/pen/lib/tree'
import * as Segment from './internals/segment'
import Route from './internals/route'

export function buildRouteTree(appPath: string): Route {
  const absPath = resolve(appPath)

  // Check if app directory exists
  if (!statSync(absPath, { throwIfNoEntry: false })?.isDirectory())
    throw new Error("Couldn't find any `app` directory. Please create one under the project root")

  const root = new Route(absPath, Segment.from(''))

  // Pass 1 — structural build (no validation)
  traverse(root, {
    visit: (route) => route.loadModules(),
    expand: (route) => route.getChildren(),
    attach: (child, parent) => parent.addChild(child),
  })

  // Pass 2 — validation (pure, per-node)
  traverse(root, {
    visit: (route) => route.validate(),
    expand: (route) => route.children,
  })

  return root
}
