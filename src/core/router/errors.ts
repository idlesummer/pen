/** Error thrown when a route has no screen component. */
export class MissingScreenError extends Error {
  constructor(public url: string) {
    super(`Route ${url} has no screen component`)
    this.name = 'MissingScreenError'
  }
}

/** Special error thrown to trigger not-found.tsx. */
export class NotFoundError extends Error {
  public readonly url: string

  constructor(url: string, message: string = 'Not Found') {
    super(message)
    this.name = 'NotFoundError'
    this.url = url
  }
}
