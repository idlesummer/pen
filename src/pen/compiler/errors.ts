/**
 * Base error for all route-builder build errors
 */
export class FileRouterError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FileRouterError'
  }
}

// ============================================================================
// File Tree Errors
// ============================================================================

export class DirectoryNotFoundError extends FileRouterError {
  constructor(public path: string) {
    super(`Directory not found: "${path}"`)
    this.name = 'DirectoryNotFoundError'
  }
}

export class NotADirectoryError extends FileRouterError {
  constructor(public path: string) {
    super(`Path is not a directory: "${path}"`)
    this.name = 'NotADirectoryError'
  }
}

// ============================================================================
// Route Tree Errors
// ============================================================================

export class RootIsFileError extends FileRouterError {
  constructor(public path: string) {
    super(
      `Root path is a file, not a directory: "${path}"\n\n` +
      'The app directory must be a directory, not a file.',
    )
    this.name = 'RootIsFileError'
  }
}

export class ConflictingCatchallError extends FileRouterError {
  constructor(public path: string) {
    super(
      `Conflicting catchall and optional-catchall routes in "${path}".\n\n` +
      'A [...catchall] and [[...splat]] cannot coexist in the same directory.',
    )
    this.name = 'ConflictingCatchallError'
  }
}

export class DuplicateCatchallError extends FileRouterError {
  constructor(public path: string) {
    super(
      `Multiple catchall routes [...param] found in "${path}".\n\n` +
      'Only one [...catchall] is allowed per directory.',
    )
    this.name = 'DuplicateCatchallError'
  }
}

export class DuplicateSplatError extends FileRouterError {
  constructor(public path: string) {
    super(
      `Multiple optional-catchall routes [[...param]] found in "${path}".\n\n` +
      'Only one [[...splat]] is allowed per directory.',
    )
    this.name = 'DuplicateSplatError'
  }
}

export class ConflictingDynamicSegmentsError extends FileRouterError {
  constructor(public path: string, public params: string[]) {
    super(
      `Conflicting dynamic segments in "${path}": ${params.map(p => `[${p}]`).join(', ')}.\n\n` +
      'Only one dynamic segment name is allowed per directory level.',
    )
    this.name = 'ConflictingDynamicSegmentsError'
  }
}

export class SplatIndexConflictError extends FileRouterError {
  constructor(public path: string) {
    super(
      `Optional-catchall [[...splat]] conflicts with static "index" segment in "${path}".\n\n` +
      'Both match the base route — remove one or rename the index segment.',
    )
    this.name = 'SplatIndexConflictError'
  }
}

export class DuplicateScreenError extends FileRouterError {
  constructor(
    public url: string,
    public files: string[],
  ) {
    super(
      `Conflicting screen routes found at "${url}":\n` +
      files.map(f => `  - ${f}`).join('\n') + '\n\n' +
      'Each URL can only have one screen file.\n' +
      'Move one screen to a different directory or rename the route segment.',
    )
    this.name = 'DuplicateScreenError'
  }
}
