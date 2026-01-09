/** Special error thrown to trigger not-found.tsx. */
export class NotFoundError extends Error {
  public readonly url: string

  constructor(url: string, message: string = 'Not Found') {
    super(message)
    this.name = 'NotFoundError'
    this.url = url
  }
}

/** Error thrown when a route has an empty chain. */
export class EmptyChainError extends Error {
  constructor(public url: string) {
    super(
      `Route ${url} has an empty chain. ` +
      'This indicates a bug in manifest generation - ' +
      'routes must have at least one segment.',
    )
    this.name = 'EmptyChainError'
  }
}

/** Error thrown when a component is missing from the component map. */
export class ComponentNotFoundError extends Error {
  constructor(public componentPath: string) {
    super(
      `Component not found: ${componentPath}. ` +
      'This indicates the component map is out of sync with the manifest. ' +
      'Try running \'pen build\' again.',
    )
    this.name = 'ComponentNotFoundError'
  }
}
