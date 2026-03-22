import { readdirSync, statSync } from 'fs'
import { resolve, join, relative, parse } from 'path'
import { traverse } from '@/lib/tree'
import { removeExtension } from '@/lib/path-utils'
import {
  FileRouterError,
  DirectoryNotFoundError,
  NotADirectoryError,
  DuplicateScreenError,
  DuplicateCatchallError,
  DuplicateOptionalCatchallError,
  ConflictingCatchallError,
  ConflictingDynamicSegmentsError,
  SplatIndexConflictError,
  EmptyParamNameError,
  RouteValidationErrors,
} from '../errors'

export const SEGMENT_ROLES = ['layout', 'screen', 'error', 'not-found'] as const
export type SegmentRole = typeof SEGMENT_ROLES[number]
export type SegmentLayer = Partial<Record<SegmentRole, string>>
export type RouteNode = {
  name: string
  type: 'static' | 'group' | 'dynamic' | 'required-catchall' | 'optional-catchall'
  param?: string
  roles?: SegmentLayer
  children?: RouteNode[]
}

// file concern: raw filesystem entry
type DirEntry = { name: string; absPath: string }

// segment concern: parsed routing semantics
type Segment = DirEntry & { type: RouteNode['type']; param?: string }

// Internal node: full context needed for both passes
type BuildNode = {
  name: string
  type: RouteNode['type']
  param?: string
  rawRoles: SegmentLayer   // absolute paths, relativized only at conversion
  children: BuildNode[]
  absPath: string
  route: string
}

// route concern: full traversal frame
type Frame = { absPath: string; buildNode: BuildNode; route: string }

/**
 * Builds a route tree directly from the filesystem in two passes:
 *   1. Build  — reads the filesystem and constructs the full tree
 *   2. Validate — walks the completed tree, collects all errors, then throws
 *
 * @param appPath - Path to the app directory
 * @param outDir - Output directory (to calculate relative import paths)
 */
export function buildRouteTree(appPath: string, outDir: string): RouteNode {
  const absPath = resolve(appPath)
  validateDirectory(absPath)

  const genDir = join(outDir, 'generated')
  const root: BuildNode = { name: '', type: 'static', rawRoles: {}, children: [], absPath, route: '/' }

  // Pass 1: Build — read filesystem, construct tree (no validation)
  traverse({ absPath, buildNode: root, route: '/' } as Frame, {
    visit: ({ absPath, buildNode }) => {
      buildNode.rawRoles = scanRoles(absPath)
    },
    expand: ({ absPath, route }) => {
      const dirs = readDirs(absPath)
      const segs = dirs.map(toSegment)                         // EmptyParamNameError may throw here
      return segs.sort(compareSegments).map(seg => toFrame(seg, route))
    },
    attach: (child, parent) =>
      parent.buildNode.children.push(child.buildNode),
  })

  // Pass 2: Validate — walk completed tree, collect all errors
  const errors: FileRouterError[] = []
  const screens: Record<string, string> = {}

  traverse(root, {
    visit: (node) => {
      if (node.rawRoles.screen) {
        const existing = screens[node.route]
        if (existing) errors.push(new DuplicateScreenError(node.route, [existing, node.rawRoles.screen]))
        else screens[node.route] = node.rawRoles.screen
      }
      if (node.children.length) validateSiblings(node.children, node.absPath, errors)
    },
    expand: (node) => node.children,
  })

  if (errors.length) throw new RouteValidationErrors(errors)

  return toRouteNode(root, genDir)
}


// - Internal Helpers ----------------------------------------------------------------------------------------------------


// file → segment → route transformation functions

function readDirs(absPath: string): DirEntry[] {
  return readdirSync(absPath, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('_'))
    .map(d => ({ name: d.name, absPath: join(absPath, d.name) }))
}

function toSegment({ name, absPath }: DirEntry): Segment {
  const type = parseSegmentType(name)
  const param = parseParam(name, type)
  if (param !== undefined && !param) throw new EmptyParamNameError(name)
  return param !== undefined ? { name, absPath, type, param } : { name, absPath, type }
}

function toFrame({ name, absPath, type, param }: Segment, parentRoute: string): Frame {
  const route = type === 'group' ? parentRoute : `${parentRoute}${name}/`
  const buildNode: BuildNode = { name, type, rawRoles: {}, children: [], absPath, route }
  if (param !== undefined) buildNode.param = param
  return { absPath, buildNode, route }
}

function toRouteNode({ name, type, param, rawRoles, children }: BuildNode, genDir: string): RouteNode {
  const node: RouteNode = { name, type }
  if (param !== undefined) node.param = param
  if (Object.keys(rawRoles).length) node.roles = relativizeRoles(rawRoles, genDir)
  node.children = children.map(c => toRouteNode(c, genDir))
  return node
}

function parseSegmentType(name: string): RouteNode['type'] {
  if (name.startsWith('(')     && name.endsWith(')'))  return 'group'
  if (name.startsWith('[[...') && name.endsWith(']]')) return 'optional-catchall'
  if (name.startsWith('[...')  && name.endsWith(']'))  return 'required-catchall'
  if (name.startsWith('[')     && name.endsWith(']'))  return 'dynamic'
  return 'static'
}

function parseParam(name: string, type: RouteNode['type']): string | void {
  if (type === 'dynamic')           return name.slice(1, -1)
  if (type === 'required-catchall') return name.slice(4, -1)
  if (type === 'optional-catchall') return name.slice(5, -2)
}

function scanRoles(absPath: string): SegmentLayer {
  const roles: SegmentLayer = {}
  for (const dirent of readdirSync(absPath, { withFileTypes: true })) {
    if (!dirent.isFile()) continue
    const { name, ext } = parse(dirent.name) as { name: SegmentRole; ext: string }
    if (ext === '.tsx' && SEGMENT_ROLES.includes(name))
      roles[name] = join(absPath, dirent.name)
  }
  return roles
}

function relativizeRoles(roles: SegmentLayer, genDir: string): SegmentLayer {
  const result: SegmentLayer = {}
  for (const [name, path] of Object.entries(roles) as [SegmentRole, string][]) {
    const relPath = relative(genDir, removeExtension(path)).replace(/\\/g, '/')
    result[name] = `${relPath}.js`
  }
  return result
}

function validateDirectory(path: string) {
  const stat = statSync(path, { throwIfNoEntry: false })
  if (!stat)               throw new DirectoryNotFoundError(path)
  if (!stat.isDirectory()) throw new NotADirectoryError(path)
}

function validateSiblings(nodes: BuildNode[], parentAbsPath: string, errors: FileRouterError[]) {
  const types = nodes.map(n => n.type)

  if (types.includes('required-catchall') && types.includes('optional-catchall'))
    errors.push(new ConflictingCatchallError(parentAbsPath))
  if (types.filter(t => t === 'required-catchall').length > 1)
    errors.push(new DuplicateCatchallError(parentAbsPath))
  if (types.filter(t => t === 'optional-catchall').length > 1)
    errors.push(new DuplicateOptionalCatchallError(parentAbsPath))

  const params = nodes.filter(n => n.type === 'dynamic').map(n => n.param!)
  if (params.length > 1)
    errors.push(new ConflictingDynamicSegmentsError(parentAbsPath, params))

  if (types.includes('optional-catchall') && nodes.some(n => n.type === 'static'))
    errors.push(new SplatIndexConflictError(parentAbsPath))

  if (types.includes('group'))
    validateSiblings(flattenGroupNodes(nodes), parentAbsPath, errors)
}

function flattenGroupNodes(nodes: BuildNode[]): BuildNode[] {
  return nodes.flatMap(node =>
    node.type === 'group'
      ? flattenGroupNodes(node.children)
      : [node],
  )
}

const RANK = { group: 0, static: 1, dynamic: 2, 'required-catchall': 3, 'optional-catchall': 4 } as const
function compareSegments(a: Segment, b: Segment): number {
  return RANK[b.type] - RANK[a.type] || b.name.localeCompare(a.name)
}
