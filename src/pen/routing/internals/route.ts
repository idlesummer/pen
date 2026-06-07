import { readdirSync } from 'fs'
import { join } from 'path'
import * as Segment from './segment'

export type RouteModule = 'layout' | 'page' | 'error' | 'not-found' | 'default'
export type RouteModules = Partial<Record<RouteModule, string>>

/**
 * A node in the route tree: data + filesystem IO only.
 *
 * `Route` holds no validation logic and no error state. All checks live in
 * `validate.ts` and run as separate passes over the built tree.
 */
export default class Route {
  readonly children: Route[] = []

  constructor(
    readonly absPath: string,
    readonly segment: Segment.Segment,
    public modules: RouteModules = {},
    public parent?: Route,
  ) {}

  get urlPath(): string {
    if (!this.parent) return '/'
    if (this.segment.type === 'group' || this.segment.type === 'slot') return this.parent.urlPath
    return `${this.parent.urlPath}${this.segment.raw}/`
  }

  /** The parallel-route slot this route belongs to — the nearest `@slot`
   *  ancestor (or self), or 'children' (the implicit default slot). */
  get slot(): string {
    if (this.segment.type === 'slot') return this.segment.slot!
    for (let route = this.parent; route; route = route.parent)
      if (route.segment.type === 'slot') return route.segment.slot!
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

  toJSON() {
    const { absPath, urlPath, segment, modules, children } = this
    return { absPath, urlPath, segment, modules, children }
  }
}
