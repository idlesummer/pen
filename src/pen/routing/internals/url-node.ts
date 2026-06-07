import type { Segment } from './segment'
import type Route from './route'

const DYNAMIC = '[*]'
const CATCHALL = '[...*]'
const OPTIONAL = '[[...*]]'

/**
 * A node in the projected URL tree — the route tree with groups erased and
 * dynamic segments generalized. Cousins that resolve to the same URL collapse
 * into one node, so URL-shaped conflicts become local to a single node.
 *
 * Like `Route`, this is data + construction only: it carries the structure and
 * knows how to build itself, but holds no validation logic. The rules that read
 * a node live in `validate.ts`.
 */
export default class UrlNode {
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

  // - structural queries (consumed by validation) -----------------------------

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
    if (route.segment.type === 'malformed')
      return // prune the malformed subtree

    // Groups and slots are URL-transparent: their own modules belong to the
    // parent URL and their children attach as if the segment were not there.
    // A slot's routes keep their identity via `route.slot`, which the
    // duplicate-screen check uses so parallel slots don't collide.
    if (route.segment.type === 'group' || route.segment.type === 'slot') {
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
    switch (segment.type) {
      case 'dynamic':           return DYNAMIC
      case 'catchall':          return CATCHALL
      case 'optional-catchall': return OPTIONAL
      default:                  return segment.raw // static
    }
  }
}
