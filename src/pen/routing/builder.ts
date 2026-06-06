import { statSync } from 'fs'
import { resolve } from 'path'
import { traverse } from '@/pen/lib/traverse'
import * as Segment from './internals/segment'
import Route from './internals/route'
import { validateIntrinsic, validateRelational } from './internals/validate'
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

  // Pass 2 — intrinsic validation (pointer-local, O(nodes)). Prune malformed
  // subtrees downward: a node under a broken parent produces only noise. Pruning
  // is downward only — every other branch is still fully validated.
  const intrinsic: FileRouterError[] = []
  traverse(root, {
    visit: (route) => { intrinsic.push(...validateIntrinsic(route)) },
    expand: (route) => route.segment.type === 'malformed' ? [] : route.children,
  })

  // Pass 3 — relational validation (cross-branch URL collisions). Runs after
  // intrinsic, which certifies the segments relational projection assumes.
  const relational = validateRelational(root)

  const all = [...intrinsic, ...relational]
  if (all.length) throw new RouteValidationErrors(all)

  return root
}
