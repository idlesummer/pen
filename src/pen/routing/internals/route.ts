import { readdirSync } from 'fs'
import { join } from 'path'
import * as Segment from './segment'

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
      }
    }
  }

  addChild(child: Route): void {
    child.parent = this
    this.children.push(child)
  }

  validate(): void {
    this.errors.length = 0
    this.validateSegment()
    this.validateChildren()
    this.validateAncestors()
  }

  private validateSegment(): void {
    this.errors.push(...Segment.validate(this.segment))
  }

  private validateChildren(): void {
    const catchalls = this.children.filter(route => route.segment.type === 'catchall')
    const optionalCatchalls = this.children.filter(route => route.segment.type === 'optional-catchall')
    const dynamics = this.children.filter(route => route.segment.type === 'dynamic')

    if (catchalls.length > 1)
      this.errors.push(new Error(
        'You cannot use different slug names for the same dynamic path' +
        `('${catchalls[0].segment.raw}' !== '${catchalls[1].segment.raw}').`,
      ))

    if (optionalCatchalls.length > 1)
      this.errors.push(new Error(
        'You cannot use different slug names for the same dynamic path' +
        `('${optionalCatchalls[0].segment.raw}' !== '${optionalCatchalls[1].segment.raw}').`,
      ))

    if (dynamics.length > 1)
      this.errors.push(new Error(
        'You cannot use different slug names for the same dynamic path' +
        `('${dynamics[0].segment.raw}' !== '${dynamics[1].segment.raw}').`,
      ))

    if (catchalls.length && optionalCatchalls.length)
      this.errors.push(new Error(
         'You cannot use both an required and optional catch-all route at the same level ' +
         `("${optionalCatchalls[0].segment.raw}" and "${dynamics[0].segment.raw}")`,
      ))

    // TODO: Check how nextjs behaves around different types of dynamic segments present under a route
  }

  private validateAncestors(): void {
    if (!this.parent) return

    const dynamicParams = new Set<string>()
    let catchallAncestor: Route | undefined

    for (let ancestor: Route | undefined = this.parent; ancestor; ancestor = ancestor.parent) {
      if (ancestor.segment.type === 'catchall' || ancestor.segment.type === 'optional-catchall')
        catchallAncestor ??= ancestor
      if (ancestor.segment.param)
        dynamicParams.add(ancestor.segment.param)
    }

    if (catchallAncestor)
      this.errors.push(new Error(
        'Catch-all must be the last part of the URL. ' +
        `Found '${this.segment.raw}' after catch-all '${catchallAncestor.segment.raw}'.`
      ))

    if (this.segment.param && dynamicParams.has(this.segment.param))
      this.errors.push(new Error(
        `You cannot have the same slug name "${this.segment.param}" ` +
        'repeat within a single dynamic path',
      ))
  }

  toJSON() {
    const { absPath, urlPath, segment, modules, children } = this
    const errors = this.errors.map(err => err.message)
    return { absPath, urlPath, segment, modules, errors, children }
  }
}
