import { readdirSync } from 'fs'
import { join } from 'path'
import { Segment } from './segment'
import {
  type FileRouterError,
  MalformedSegmentError,
  RepeatedSlugError,
} from '../errors'

export type RouteModule = 'layout' | 'page' | 'error' | 'not-found' | 'default'
export type RouteModules = Partial<Record<RouteModule, string>>

/**
 * A node in the route tree: one directory on disk.
 *
 * Holds its structure and the filesystem IO that builds it, and knows the rules
 * it can judge from itself alone — see `localErrors`. Cross-branch rules (two
 * routes colliding at one URL) belong to `UrlNode`, not here.
 */
export class Route {
  readonly children: Route[] = []

  constructor(
    readonly absPath: string,
    readonly segment: Segment,
    public modules: RouteModules = {},
    public parent?: Route,
  ) {}

  get urlPath(): string {
    if (!this.parent) return '/'
    if (this.segment.isTransparent) return this.parent.urlPath
    return `${this.parent.urlPath}${this.segment.raw}/`
  }

  /** The parallel-route slot this route belongs to — the nearest `@slot`
   *  ancestor (or self), or 'children' (the implicit default slot). */
  get slot(): string {
    if (this.segment.isSlot) return this.segment.slot!
    for (let route = this.parent; route; route = route.parent)
      if (route.segment.isSlot) return route.segment.slot!
    return 'children'
  }

  getChildren(): Route[] {
    return readdirSync(this.absPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('_'))
      .map(dirent => new Route(join(this.absPath, dirent.name), Segment.from(dirent.name)))
  }

  loadModules(): void {
    this.modules = {}

    for (const dirent of readdirSync(this.absPath, { withFileTypes: true })) {
      if (!dirent.isFile())
        continue
      const absPath = join(this.absPath, dirent.name)
      switch (dirent.name) {
        case 'layout.tsx':    this.modules.layout = absPath; break
        case 'page.tsx':      this.modules.page = absPath; break
        case 'error.tsx':     this.modules.error = absPath; break
        case 'not-found.tsx': this.modules['not-found'] = absPath; break
        case 'default.tsx':   this.modules.default = absPath; break
      }
    }
  }

  addChild(child: Route): void {
    child.parent = this
    this.children.push(child)
  }

  /**
   * Findings this node can judge from itself and its ancestor chain alone —
   * inputs that never leave the route tree, so they can't move to `UrlNode`.
   * A malformed name doesn't project to a URL; slug repetition is a property of
   * one concrete path. (The walk in `validate` prunes a malformed subtree, so a
   * node under a broken parent never reaches here.)
   */
  localErrors(): FileRouterError[] {
    const { segment } = this

    // Malformed: report the parse error and stop — the subtree is noise.
    if (segment.isMalformed)
      return [new MalformedSegmentError(this.urlPath, segment.reason ?? 'malformed segment')]

    // A slug name may not repeat up a single route path.
    if (segment.param)
      for (let ancestor = this.parent; ancestor; ancestor = ancestor.parent)
        if (ancestor.segment.param === segment.param)
          return [new RepeatedSlugError(this.urlPath, segment.param)]

    return []
  }

  toJSON() {
    const { absPath, urlPath, segment, modules, children } = this
    return { absPath, urlPath, segment, modules, children }
  }
}
