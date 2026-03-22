import { readdirSync, statSync } from 'fs'
import { resolve, join, relative, parse } from 'path'
import { traverse } from '@/lib/tree'
import { removeExtension } from '@/lib/path-utils'
import {
  DirectoryNotFoundError,
  NotADirectoryError,
  DuplicateScreenError,
  DuplicateCatchallError,
  DuplicateOptionalCatchallError,
  ConflictingCatchallError,
  ConflictingDynamicSegmentsError,
  SplatIndexConflictError,
  EmptyParamNameError,
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

// route concern: full traversal frame with URL and tree node
type Frame = { absPath: string; routeNode: RouteNode; route: string }

/**
 * Builds a route tree directly from the filesystem in a single pass.
 *
 * Reads directories, interprets segment names, validates route structure,
 * and produces a JSON-serializable RouteNode tree with relativized import paths.
 *
 * @param appPath - Path to the app directory
 * @param outDir - Output directory (to calculate relative import paths)
 */
export function buildRouteTree(appPath: string, outDir: string): RouteNode {
  const absPath = resolve(appPath)
  validateDirectory(absPath)

  const genDir = join(outDir, 'generated')
  const screens: Record<string, string> = {}
  const root: RouteNode = { name: '', type: 'static' }

  traverse({ absPath, routeNode: root, route: '/' } as Frame, {
    visit: ({ absPath, routeNode, route }) => {
      const rawRoles = scanRoles(absPath)                           // file: read role files
      if (rawRoles.screen) {                                        // route: duplicate screen check
        if (screens[route]) throw new DuplicateScreenError(route, [screens[route]!, rawRoles.screen])
        screens[route] = rawRoles.screen
      }

      if (Object.keys(rawRoles).length)                            // route: attach relativized roles
        routeNode.roles = relativizeRoles(rawRoles, genDir)
      routeNode.children = []                                      // route: init children (preserves field order)
    },
    expand: ({ absPath, route }) => {
      const dirs = readDirs(absPath)                               // file: read + filter entries
      const segs = dirs.map(toSegment)                             // segment: parse names → types/params
      validateSiblings(segs, absPath)                              // segment: conflict checks
      return segs.sort(compareSegments).map(seg => toFrame(seg, route)) // route: build frames
    },
    attach: (child, parent) =>
      parent.routeNode.children!.push(child.routeNode),
  })

  return root
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
  const routeNode: RouteNode = param !== undefined ? { name, type, param } : { name, type }
  return { absPath, routeNode, route }
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

function validateSiblings(segs: Segment[], parentAbsPath: string) {
  const types = segs.map(s => s.type)

  if (types.includes('required-catchall') && types.includes('optional-catchall'))
    throw new ConflictingCatchallError(parentAbsPath)
  if (types.filter(t => t === 'required-catchall').length > 1)
    throw new DuplicateCatchallError(parentAbsPath)
  if (types.filter(t => t === 'optional-catchall').length > 1)
    throw new DuplicateOptionalCatchallError(parentAbsPath)

  const params = segs.filter(s => s.type === 'dynamic').map(s => s.param!)
  if (params.length > 1)
    throw new ConflictingDynamicSegmentsError(parentAbsPath, params)

  if (types.includes('optional-catchall') && segs.some(s => s.type === 'static'))
    throw new SplatIndexConflictError(parentAbsPath)

  if (types.includes('group'))
    validateSiblings(flattenGroupSegs(segs), parentAbsPath)
}

function flattenGroupSegs(segs: Segment[]): Segment[] {
  return segs.flatMap(seg =>
    seg.type === 'group'
      ? flattenGroupSegs(readDirs(seg.absPath).map(toSegment))
      : [seg],
  )
}

const RANK = { group: 0, static: 1, dynamic: 2, 'required-catchall': 3, 'optional-catchall': 4 } as const
function compareSegments(a: Segment, b: Segment): number {
  return RANK[b.type] - RANK[a.type] || b.name.localeCompare(a.name)
}
