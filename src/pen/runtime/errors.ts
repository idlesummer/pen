/** Special error thrown to trigger not-found.tsx. */
export class NotFoundError extends Error {
  public readonly url: string

  constructor(url: string, message: string = 'Not Found') {
    super(message)
    this.name = 'NotFoundError'
    this.url = url
  }
}
