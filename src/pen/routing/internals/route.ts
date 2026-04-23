import { readdirSync } from 'fs'
import { join } from 'path'
import * as Segment from './segment'

export type RouteModule = 'layout' | 'page' | 'error' | 'not-found'
export type RouteModules = Partial<Record<RouteModule, string>>

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
    if (this.segment.type === 'group') return this.parent.urlPath
    return `${this.parent.urlPath}${this.segment.raw}/`
  }

  getChildren(): Route[] {
    return readdirSync(this.absPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('_'))
      .map(dirent => new Route(
        join(this.absPath, dirent.name),
        Segment.from(dirent.name),
      ))
  }

  loadModules(): void {
    this.modules = {}

    for (const dirent of readdirSync(this.absPath, { withFileTypes: true })) {
      if (dirent.isFile())
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

  addChild(child: Route): void {
    child.parent = this
    this.children.push(child)
  }
}
