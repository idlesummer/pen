import { readdirSync } from 'fs'
import { join } from 'path'
import * as Segment from './segment'
import {
  ConflictingCatchallError,
  ConflictingDynamicSegmentsError,
  DuplicateCatchallError,
  DuplicateOptionalCatchallError,
  SplatIndexConflictError,
} from '../errors'

export type RouteModule = 'layout' | 'page' | 'error' | 'not-found'
export type RouteModules = Partial<Record<RouteModule, string>>

export default class Route {
  readonly children: Route[] = []
  readonly errors: Error[] = []

  constructor(
    readonly absPath: string,
    readonly segment: Segment.Segment,
    public modules: RouteModules = {},
    public parent?: Route,
  ) {}

  get urlPath(): string {
    if (!this.parent) return '/'
    if (this.segment.type === 'group') return this.parent.urlPath
    return `${this.parent.urlPath}${this.segment.raw}/`
  }

  getChildren(): Route[] {
    const children = readdirSync(this.absPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('_'))
      .map(dirent => {
        const { segment, errors } = Segment.from(dirent.name)
        const route = new Route(join(this.absPath, dirent.name), segment)
        route.errors.push(...errors)
        return route
      })

    this.validateChildren(children)
    return children
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
      }
    }
  }

  validateModules(): void {
    if (!this.modules.page) return

    let root: Route = this
    while (root.parent) root = root.parent

    if (!root.modules.layout)
      this.errors.push(new Error(
        `${this.modules.page} doesn't have a root layout. To fix this error, make sure every page has a root layout.`,
      ))
  }

  addChild(child: Route): void {
    child.parent = this
    this.children.push(child)
  }

  private validateChildren(children: Route[]): void {
    const requiredCatchalls = children.filter(route => route.segment.type === 'catchall')
    if (requiredCatchalls.length > 1)
      throw new DuplicateCatchallError(this.absPath)

    const optionalCatchalls = children.filter(route => route.segment.type === 'optional-catchall')
    if (optionalCatchalls.length > 1)
      throw new DuplicateOptionalCatchallError(this.absPath)

    const dynamics = children.filter(route => route.segment.type === 'dynamic')
    if (requiredCatchalls.length && optionalCatchalls.length)
      throw new ConflictingCatchallError(this.absPath)

    const params = [...new Set(dynamics.map(route => route.segment.param))]
    if (params.length > 1)
      throw new ConflictingDynamicSegmentsError(this.absPath, params as string[])

    const statics = children.filter(route => route.segment.type === 'static')
    if (optionalCatchalls.length && statics.length)
      throw new SplatIndexConflictError(this.absPath)
  }

  toJSON() {
    return {
      absPath: this.absPath,
      urlPath: this.urlPath,
      segment: this.segment,
      modules: this.modules,
      errors: this.errors.map(err => err.message),
      children: this.children,
    }
  }
}
