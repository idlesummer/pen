// src/core/file-router/errors.ts

/**
 * Base error for all file-router build errors
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

export class DuplicateLayoutError extends FileRouterError {
  constructor(
    public path: string,
    public files: string[],
  ) {
    super(
      `Conflicting layout files found in "${path}":\n` +
      files.map(f => `  - ${f}`).join('\n') + '\n\n' +
      'Only one layout file is allowed per directory.\n' +
      'Keep one file and remove the others.',
    )
    this.name = 'DuplicateLayoutError'
  }
}

export class DuplicateScreenFileError extends FileRouterError {
  constructor(
    public path: string,
    public files: string[],
  ) {
    super(
      `Conflicting screen files found in "${path}":\n` +
      files.map(f => `  - ${f}`).join('\n') + '\n\n' +
      'Only one screen file is allowed per directory.\n' +
      'Keep one file and remove the others.',
    )
    this.name = 'DuplicateScreenFileError'
  }
}
