import { statSync } from 'fs'
import { resolve } from 'path'
import { traverse } from '@/pen/lib/traverse'
import * as Segment from './internals/segment'
import Route from './internals/route'
import { validateRouteTree, validateUrlTree } from './internals/validate'
import {
  type FileRouterError,
  DirectoryNotFoundError,
  NotADirectoryError,
  RouteValidationErrors,
} from './errors'

export function buildRouteTree(appPath: string): Route {
  const absPath = resolve(appPath)

  // Precondition — a missing/invalid app dir means nothing else can run, so
  // throw immediately rather than collecting it as a finding.
  const stat = statSync(absPath, { throwIfNoEntry: false })
  if (!stat) throw new DirectoryNotFoundError(absPath)
  if (!stat.isDirectory()) throw new NotADirectoryError(absPath)

  const root = new Route(absPath, Segment.from(''))

  // Pass 1 — structural build (no validation).
  traverse(root, {
    visit: (route) => route.loadModules(),
    expand: (route) => route.getChildren(),
    attach: (child, parent) => parent.addChild(child),
  })

  // Pass 2 — validation. Route-tree checks cover the pointer-local rules
  // (malformed names, repeated slugs); the URL-tree pass projects the tree with
  // groups flattened and catches everything that only surfaces there
  // (collisions, slug agreement, splat overlaps, terminality).
  const errors: FileRouterError[] = [
    ...validateRouteTree(root),
    ...validateUrlTree(root),
  ]
  if (errors.length) throw new RouteValidationErrors(errors)

  return root
}
