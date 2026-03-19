/** Base error for all route-builder build errors */
export class FileRouterError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FileRouterError'
  }
}


// - File Tree Errors ----------------------------------------------------------------------------------------------------


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

export class RootIsFileError extends FileRouterError {
  constructor(public path: string) {
    super(
      `Root path is a file, not a directory: "${path}"\n\n` +
      'The app directory must be a directory, not a file.',
    )
    this.name = 'RootIsFileError'
  }
}


// - Segment Tree Errors -------------------------------------------------------------------------------------------------


export class DuplicateCatchallError extends FileRouterError {
  constructor(public path: string) {
    super(
      `Multiple [...slug] routes found in "${path}".\n\n` +
      'Only one [...slug] is allowed per directory.',
    )
    this.name = 'DuplicateCatchallError'
  }
}

export class DuplicateOptionalCatchallError extends FileRouterError {
  constructor(public path: string) {
    super(
      `Multiple [[...slug]] routes found in "${path}".\n\n` +
      'Only one [[...slug]] is allowed per directory.',
    )
    this.name = 'DuplicateOptionalCatchallError'
  }
}

export class ConflictingCatchallError extends FileRouterError {
  constructor(public path: string) {
    super(
      `Conflicting [...slug] and [[...slug]] routes in "${path}".\n\n` +
      'A [...slug] and [[...slug]] cannot coexist in the same directory.',
    )
    this.name = 'ConflictingCatchallError'
  }
}

export class ConflictingDynamicSegmentsError extends FileRouterError {
  constructor(public path: string, public params: string[]) {
    super(
      `Conflicting dynamic segments in "${path}": ${params.map(p => `[${p}]`).join(', ')}.\n\n` +
      'Only one [param] name is allowed per directory level.',
    )
    this.name = 'ConflictingDynamicSegmentsError'
  }
}

export class SplatIndexConflictError extends FileRouterError {
  constructor(public path: string) {
    super(
      `[[...slug]] conflicts with static "index" segment in "${path}".\n\n` +
      'Both match the base route — remove one or rename the index segment.',
    )
    this.name = 'SplatIndexConflictError'
  }
}

export class EmptyParamNameError extends FileRouterError {
  constructor(public name: string) {
    super(
      `Dynamic segment "${name}" has no param name.\n\n` +
      'Rename the directory to include a param name, e.g. [id], [...slug], or [[...slug]].',
    )
    this.name = 'EmptyParamNameError'
  }
}


// - Route Tree Errors ---------------------------------------------------------------------------------------------------



export class DuplicateScreenError extends FileRouterError {
  constructor(
    public url: string,
    public files: [string, string],
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
