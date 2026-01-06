/**
 * Error thrown when a route has no screen component.
 */
export class MissingScreenError extends Error {
  constructor(public url: string) {
    super(`Route ${url} has no screen component`)
    this.name = 'MissingScreenError'
  }
}
