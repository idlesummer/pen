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
export type RouteTreeNode = {
  name: string
  type: 'static' | 'group' | 'dynamic' | 'required-catchall' | 'optional-catchall'
  param?: string
  roles?: SegmentLayer
  children?: RouteTreeNode[]
}

type Frame = {
  absPath: string
  routeNode: RouteTreeNode
  route: string
}

/**
 * Builds a route tree directly from the filesystem in a single pass.
 *
 * Reads directories, interprets segment names, validates route structure,
 * and produces a JSON-serializable RouteTreeNode tree with relativized import paths.
 *
 * @param appPath - Path to the app directory
 * @param outDir - Output directory (to calculate relative import paths)
 */
export function buildRouteTree(appPath: string, outDir: string): RouteTreeNode {
  const absPath = resolve(appPath)
  validateDirectory(absPath)

  const genDir = join(outDir, 'generated')
  const screens: Record<string, string> = {}
  const root: RouteTreeNode = { name: '', type: 'static' }

  traverse({ absPath, routeNode: root, route: '/' } as Frame, {
    visit: ({ absPath, routeNode, route }) => {
      const rawRoles = scanRoles(absPath)

      if (rawRoles.screen) {
        if (screens[route]) throw new DuplicateScreenError(route, [screens[route]!, rawRoles.screen])
        screens[route] = rawRoles.screen
      }

      if (Object.keys(rawRoles).length)
        routeNode.roles = relativizeRoles(rawRoles, genDir)

      if (routeNode.param !== undefined && !routeNode.param)
        throw new EmptyParamNameError(routeNode.name)

      routeNode.children = [] // ensures children field appears last in the object
    },
    expand: ({ absPath, route }) => {
      const children = buildChildren(absPath, route)
      validateChildTypes(children, absPath)
      return children
    },
    attach: (child, parent) => {
      parent.routeNode.children!.push(child.routeNode)
    },
  })

  return root
}


// - Internal Helpers ----------------------------------------------------------------------------------------------------


function buildChildren(absPath: string, route: string): Frame[] {
  return readdirSync(absPath, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('_'))
    .map(d => {
      const name = d.name
      const childAbsPath = join(absPath, name)
      const type = parseSegmentType(name)
      const param = parseParam(name, type)
      const childRoute = type === 'group' ? route : `${route}${name}/`
      const routeNode: RouteTreeNode = { name, type }
      if (param !== undefined) routeNode.param = param
      return { absPath: childAbsPath, routeNode, route: childRoute }
    })
    .sort((a, b) => compareSegments(a.routeNode, b.routeNode))
}

function parseSegmentType(name: string): RouteTreeNode['type'] {
  if (name.startsWith('(')     && name.endsWith(')'))  return 'group'
  if (name.startsWith('[[...') && name.endsWith(']]')) return 'optional-catchall'
  if (name.startsWith('[...')  && name.endsWith(']'))  return 'required-catchall'
  if (name.startsWith('[')     && name.endsWith(']'))  return 'dynamic'
  return 'static'
}

function parseParam(name: string, type: RouteTreeNode['type']): string | undefined {
  if (type === 'dynamic')           return name.slice(1, -1)
  if (type === 'required-catchall') return name.slice(4, -1)
  if (type === 'optional-catchall') return name.slice(5, -2)
  return undefined
}

function scanRoles(absPath: string): Partial<Record<SegmentRole, string>> {
  const roles: Partial<Record<SegmentRole, string>> = {}
  for (const dirent of readdirSync(absPath, { withFileTypes: true })) {
    if (!dirent.isFile()) continue
    const { name, ext } = parse(dirent.name)
    if (ext === '.tsx' && (SEGMENT_ROLES as readonly string[]).includes(name))
      roles[name as SegmentRole] = join(absPath, dirent.name)
  }
  return roles
}

function relativizeRoles(roles: Partial<Record<SegmentRole, string>>, genDir: string): SegmentLayer {
  const result: SegmentLayer = {}
  for (const [name, path] of Object.entries(roles) as [SegmentRole, string][]) {
    const relPath = relative(genDir, removeExtension(path)).replace(/\\/g, '/')
    result[name] = `${relPath}.js`
  }
  return result
}

function validateDirectory(path: string) {
  const stat = statSync(path, { throwIfNoEntry: false })
  if (!stat) throw new DirectoryNotFoundError(path)
  if (!stat.isDirectory()) throw new NotADirectoryError(path)
}

function validateChildTypes(frames: Frame[], parentAbsPath: string) {
  const types = frames.map(f => f.routeNode.type)

  if (types.includes('required-catchall') && types.includes('optional-catchall'))
    throw new ConflictingCatchallError(parentAbsPath)
  if (types.filter(t => t === 'required-catchall').length > 1)
    throw new DuplicateCatchallError(parentAbsPath)
  if (types.filter(t => t === 'optional-catchall').length > 1)
    throw new DuplicateOptionalCatchallError(parentAbsPath)

  const params = frames.filter(f => f.routeNode.type === 'dynamic').map(f => f.routeNode.param!)
  if (params.length > 1)
    throw new ConflictingDynamicSegmentsError(parentAbsPath, params)

  if (types.includes('optional-catchall') && frames.some(f => f.routeNode.type === 'static'))
    throw new SplatIndexConflictError(parentAbsPath)

  if (types.includes('group'))
    validateChildTypes(flattenGroups(frames), parentAbsPath)
}

function flattenGroups(frames: Frame[]): Frame[] {
  return frames.flatMap(frame =>
    frame.routeNode.type === 'group'
      ? flattenGroups(buildChildren(frame.absPath, frame.route))
      : [frame],
  )
}

const RANK = { group: 0, static: 1, dynamic: 2, 'required-catchall': 3, 'optional-catchall': 4 } as const
function compareSegments(a: RouteTreeNode, b: RouteTreeNode): number {
  return RANK[b.type] - RANK[a.type] || b.name.localeCompare(a.name)
}
