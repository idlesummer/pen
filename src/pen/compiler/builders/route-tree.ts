import { join, relative } from 'path'
import { traverse } from '@/lib/tree'
import { removeExtension } from '@/lib/path-utils'
import {
  FileRouterError,
  DuplicateScreenError,
  DuplicateCatchallError,
  DuplicateOptionalCatchallError,
  ConflictingCatchallError,
  ConflictingDynamicSegmentsError,
  SplatIndexConflictError,
  EmptyParamNameError,
  RouteValidationErrors,
} from '../errors'
import type { RolesMapping } from '../pipeline/create-roles-mapping'
import type { RoutesBuckets } from '../pipeline/create-routes-buckets'

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

// Internal node used during tree construction and validation
type BuildNode = {
  name: string
  type: RouteNode['type']
  param?: string
  rawRoles: SegmentLayer  // absolute paths, relativized only at conversion
  children: BuildNode[]
  route: string           // normalized URL for this node (groups transparent)
}

/**
 * Step 5 (build) / final step of transform() (dev):
 * Takes the bucketed entry points from step 4 and builds the RouteNode tree.
 *
 * Equivalent to how Next.js's next-app-loader receives appPathsPerRoute per
 * route and resolves the segment hierarchy — except Pen builds a single shared
 * tree rather than per-route loader bundles.
 *
 * Two internal passes:
 *   1. buildTreeFromBuckets — parse raw route keys into a node hierarchy
 *   2. validate             — structural sibling checks (catchall conflicts,
 *                             dynamic param conflicts). URL-level checks
 *                             (duplicate screens) are handled upstream in
 *                             validateAppPaths (step 3).
 *
 * @param buckets - appPathsPerRoute equivalent: normalizedUrl → per-role route key
 * @param mapping - raw route key → absolute path (needed for abs path lookup)
 * @param outDir  - output directory (to relativize import paths in the emitted tree)
 */
export function buildRouteTree(buckets: RoutesBuckets, mapping: RolesMapping, outDir: string): RouteNode {
  const genDir = join(outDir, 'generated')

  // Pass 1: build tree from buckets
  const root = buildTreeFromBuckets(buckets, mapping)

  // Pass 2: validate — duplicate screens + structural sibling checks
  const errors: FileRouterError[] = []
  const screens: Record<string, string> = {}

  traverse(root, {
    visit: (node) => {
      if (node.rawRoles.screen) {
        if (!screens[node.route])
          screens[node.route] = node.rawRoles.screen
        else
          errors.push(new DuplicateScreenError(node.route, [screens[node.route]!, node.rawRoles.screen]))
      }
      if (node.children.length)
        validateSiblings(node.children, node.route, errors)
    },
    expand: (node) => node.children,
  })

  if (errors.length)
    throw new RouteValidationErrors(errors)
  return toRouteNode(root, genDir)
}


// - Pass 1: tree builder ------------------------------------------------------------------------------------------------


/**
 * Iterates over each bucket (normalizedUrl → roles), extracts raw route keys
 * from the bucket values, and inserts the corresponding nodes into the tree.
 *
 * Raw route keys (groups preserved) are used for parsing the segment hierarchy,
 * so groups appear as tree nodes even though they are transparent in the URL.
 * Absolute paths are looked up from the mapping by route key.
 *
 * '/(marketing)/blog/screen' → root → (marketing)[group] → blog[static] .rawRoles.screen
 */
function buildTreeFromBuckets(buckets: RoutesBuckets, mapping: RolesMapping): BuildNode {
  const root: BuildNode = { name: '', type: 'static', rawRoles: {}, children: [], route: '/' }

  for (const roles of Object.values(buckets)) {
    for (const [role, routeKeys] of Object.entries(roles) as [SegmentRole, string[]][]) {
      for (const routeKey of routeKeys) {
      const absPath = mapping[routeKey]!
      const parts = routeKey.split('/').filter(Boolean)
      // last part is the role name (screen, layout, etc.)
      const segments = parts.slice(0, -1)

      let node = root
      let currentRoute = '/'

      for (const seg of segments) {
        const type = parseSegmentType(seg)
        const param = parseParam(seg, type)
        if (param !== undefined && !param) throw new EmptyParamNameError(seg)

        // Groups are transparent — they don't advance the URL
        const nextRoute = type === 'group' ? currentRoute : `${currentRoute}${seg}/`

        let child = node.children.find(c => c.name === seg)
        if (!child) {
          child = { name: seg, type, rawRoles: {}, children: [], route: nextRoute }
          if (param !== undefined) child.param = param
          node.children.push(child)
        }

        currentRoute = nextRoute
        node = child
      }

      node.rawRoles[role] = absPath
      } // end for routeKey
    }
  }

  sortAllChildren(root)
  return root
}

function sortAllChildren(node: BuildNode) {
  node.children.sort(compareNodes)
  for (const child of node.children) sortAllChildren(child)
}

// Lower RANK value → earlier in sorted output (static first, catchall last)
const RANK = { group: 0, static: 1, dynamic: 2, 'required-catchall': 3, 'optional-catchall': 4 } as const

function compareNodes(a: BuildNode, b: BuildNode): number {
  return RANK[a.type] - RANK[b.type] || a.name.localeCompare(b.name)
}


// - Internal Helpers ---------------------------------------------------------------------------------------------------


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

function toRouteNode({ name, type, param, rawRoles, children }: BuildNode, genDir: string): RouteNode {
  const node: RouteNode = { name, type }
  if (param !== undefined) node.param = param
  if (Object.keys(rawRoles).length) node.roles = relativizeRoles(rawRoles, genDir)
  node.children = children.map(c => toRouteNode(c, genDir))
  return node
}

function relativizeRoles(roles: SegmentLayer, genDir: string): SegmentLayer {
  const result: SegmentLayer = {}
  for (const [name, path] of Object.entries(roles) as [SegmentRole, string][]) {
    const relPath = relative(genDir, removeExtension(path)).replace(/\\/g, '/')
    result[name] = `${relPath}.js`
  }
  return result
}

function validateSiblings(nodes: BuildNode[], parentRoute: string, errors: FileRouterError[]) {
  const types = nodes.map(n => n.type)

  if (types.includes('required-catchall') && types.includes('optional-catchall'))
    errors.push(new ConflictingCatchallError(parentRoute))
  if (types.filter(t => t === 'required-catchall').length > 1)
    errors.push(new DuplicateCatchallError(parentRoute))
  if (types.filter(t => t === 'optional-catchall').length > 1)
    errors.push(new DuplicateOptionalCatchallError(parentRoute))

  const params = nodes.filter(n => n.type === 'dynamic').map(n => n.param!)
  if (params.length > 1)
    errors.push(new ConflictingDynamicSegmentsError(parentRoute, params))

  if (types.includes('optional-catchall') && nodes.some(n => n.type === 'static'))
    errors.push(new SplatIndexConflictError(parentRoute))

  if (types.includes('group'))
    validateSiblings(flattenGroupNodes(nodes), parentRoute, errors)
}

function flattenGroupNodes(nodes: BuildNode[]): BuildNode[] {
  return nodes.flatMap(node =>
    node.type === 'group'
      ? flattenGroupNodes(node.children)
      : [node],
  )
}
