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

/**
 * Build the route tree and validate it. Accumulates every finding and throws a
 * single `RouteValidationErrors`, or returns the tree when clean.
 */
export function buildRouteTree(appPath: string): Route {
  const root = readRouteTree(appPath)

  // Route-tree checks cover the pointer-local rules (malformed names, repeated
  // slugs); the URL-tree pass projects the tree with groups flattened and catches
  // everything that only surfaces there (collisions, slug agreement, overlaps).
  const errors: FileRouterError[] = [
    ...validateRouteTree(root),
    ...validateUrlTree(root),
  ]
  if (errors.length) throw new RouteValidationErrors(errors)

  return root
}

/**
 * Read the app directory into a route tree — structure only, no validation.
 * Throws only the directory precondition (a missing/invalid app dir means
 * nothing else can run); exposed so tooling can inspect an unvalidated tree.
 */
export function readRouteTree(appPath: string): Route {
  const absPath = resolve(appPath)

  const stat = statSync(absPath, { throwIfNoEntry: false })
  if (!stat) throw new DirectoryNotFoundError(absPath)
  if (!stat.isDirectory()) throw new NotADirectoryError(absPath)

  const root = new Route(absPath, Segment.from(''))
  traverse(root, {
    visit: (route) => route.loadModules(),
    expand: (route) => route.getChildren(),
    attach: (child, parent) => parent.addChild(child),
  })
  return root
}
