import type { Segment } from './segment'
import type { Route } from './route'
import {
  type FileRouterError,
  DuplicateScreenError,
  ConflictingDynamicSegmentsError,
  DuplicateCatchallError,
  DuplicateOptionalCatchallError,
  ConflictingCatchallError,
  SplatIndexConflictError,
  OptionalCatchallPageConflictError,
  CatchallNotTerminalError,
} from '../errors'

const DYNAMIC = '[*]'
const CATCHALL = '[...*]'
const OPTIONAL = '[[...*]]'

/**
 * A node in the projected URL tree — the route tree with groups erased and
 * dynamic segments generalized. Cousins that resolve to the same URL collapse
 * into one node, which is what makes URL-shaped conflicts *local*: every
 * cross-branch rule becomes a check this node can run on itself (`localErrors`).
 */
export class UrlNode {
  readonly children = new Map<string, UrlNode>()
  readonly routes: Route[] = []   // route nodes that resolve to this URL

  constructor(
    readonly key: string,         // '' | static name | '[*]' | '[...*]' | '[[...*]]'
    readonly url: string,         // normalized URL, for messages
  ) {}

  /**
   * Project a route tree into a URL tree: groups erased, dynamics generalized,
   * malformed subtrees pruned.
   */
  static project(root: Route): UrlNode {
    const urlRoot = new UrlNode('', '/')
    urlRoot.routes.push(root)
    for (const child of root.children)
      urlRoot.attach(child)
    return urlRoot
  }

  // - structural queries -------------------------------------------------------

  /** Route nodes at this URL that render a screen. */
  get screens(): Route[] {
    return this.routes.filter(route => route.modules.page)
  }

  get dynamic(): UrlNode | undefined { return this.children.get(DYNAMIC) }
  get catchall(): UrlNode | undefined { return this.children.get(CATCHALL) }
  get optional(): UrlNode | undefined { return this.children.get(OPTIONAL) }

  get staticChildren(): UrlNode[] {
    return [...this.children.values()].filter(child => child.isStatic)
  }

  get isStatic(): boolean { return this.key !== DYNAMIC && this.key !== CATCHALL && this.key !== OPTIONAL }
  get isDynamic(): boolean { return this.key === DYNAMIC }
  get isCatchall(): boolean { return this.key === CATCHALL }
  get isOptional(): boolean { return this.key === OPTIONAL }

  /** Whether any descendant (not this node) renders a screen. */
  hasScreenDescendant(): boolean {
    for (const child of this.children.values())
      if (child.screens.length || child.hasScreenDescendant())
        return true
    return false
  }

  // - validation (everything readable from this URL position) ------------------

  /**
   * Findings local to this URL position. The projection did the hard part:
   * routes that share a URL already collapsed into this one node, so each rule
   * is a plain question about `this` — there is no same-parent vs cross-group
   * distinction left to track.
   */
  localErrors(): FileRouterError[] {
    const errors: FileRouterError[] = []

    // Identity: several route dirs collapsed into one dynamic position. When that
    // happens it's the root cause of the collapse, so the duplicate screens below
    // are just its symptom — report the identity error and skip them.
    const identity = this.identityError()
    if (identity) errors.push(identity)
    else errors.push(...this.duplicateScreenErrors())

    // NOTE (parallel routes): the structural checks below are not yet slot-scoped.
    // They treat a position's slots together — correct until two slots place
    // *different* dynamic kinds/names at the same position. Per-slot scoping of
    // these is the follow-up.

    // A catch-all and an optional catch-all overlap at the same position.
    if (this.catchall && this.optional)
      errors.push(new ConflictingCatchallError(this.url))

    // An optional catch-all overlaps a static sibling (both match the base path).
    if (this.optional && this.staticChildren.length)
      errors.push(new SplatIndexConflictError(this.url))

    // An optional catch-all overlaps its parent's screen (it matches zero segments).
    if (this.optional && this.screens.length)
      errors.push(new OptionalCatchallPageConflictError(this.optional.url))

    // A catch-all / optional catch-all must be terminal: nothing routable below it.
    for (const splat of [this.catchall, this.optional])
      if (splat?.hasScreenDescendant())
        errors.push(new CatchallNotTerminalError(splat.url))

    return errors
  }

  /**
   * The conflict raised when more than one route dir collapses into this dynamic
   * position. Dynamics tolerate a repeated *consistent* slug name across groups;
   * catch-alls and optional catch-alls allow only one route per position.
   */
  private identityError(): FileRouterError | undefined {
    if (this.isDynamic) {
      const names = [...new Set(this.routes.map(route => route.segment.param!))]
      if (names.length > 1) return new ConflictingDynamicSegmentsError(this.url, names)
    } else if (this.isCatchall) {
      if (this.routes.length > 1) return new DuplicateCatchallError(this.url)
    } else if (this.isOptional) {
      if (this.routes.length > 1) return new DuplicateOptionalCatchallError(this.url)
    }
    return undefined
  }

  /**
   * Two screens at one URL — checked *per parallel-route slot*. Slots share a URL
   * but render into different layout slots, so only a same-slot pair collides
   * (everything is in the implicit 'children' slot unless under an `@slot`).
   */
  private duplicateScreenErrors(): FileRouterError[] {
    const errors: FileRouterError[] = []
    for (const screens of this.screensBySlot().values())
      for (let i = 0; i < screens.length; i++)
        for (let j = i + 1; j < screens.length; j++)
          errors.push(new DuplicateScreenError(this.url, [screens[i].modules.page!, screens[j].modules.page!]))
    return errors
  }

  /** Partition this position's screens by their parallel-route slot. */
  private screensBySlot(): Map<string, Route[]> {
    const bySlot = new Map<string, Route[]>()
    for (const route of this.screens) {
      const list = bySlot.get(route.slot) ?? []
      list.push(route)
      bySlot.set(route.slot, list)
    }
    return bySlot
  }

  toJSON() {
    return {
      key: this.key,
      url: this.url,
      screens: this.screens.map(route => route.modules.page),
      children: [...this.children.values()],
    }
  }

  // - construction ------------------------------------------------------------

  private attach(route: Route): void {
    if (route.segment.isMalformed)
      return // prune the malformed subtree

    // Groups and slots are URL-transparent: their own modules belong to the
    // parent URL and their children attach as if the segment were not there.
    // A slot's routes keep their identity via `route.slot`, which the
    // duplicate-screen check uses so parallel slots don't collide.
    if (route.segment.isTransparent) {
      this.routes.push(route)
      for (const child of route.children)
        this.attach(child)
      return
    }

    const child = this.childFor(UrlNode.normalize(route.segment))
    child.routes.push(route)
    for (const grandchild of route.children)
      child.attach(grandchild)
  }

  private childFor(key: string): UrlNode {
    let node = this.children.get(key)
    if (!node) {
      const url = this.url === '/' ? `/${key}` : `${this.url}/${key}`
      node = new UrlNode(key, url)
      this.children.set(key, node)
    }
    return node
  }

  private static normalize(segment: Segment): string {
    if (segment.isDynamic) return DYNAMIC
    if (segment.isCatchall) return CATCHALL
    if (segment.isOptional) return OPTIONAL
    return segment.raw // static
  }
}
