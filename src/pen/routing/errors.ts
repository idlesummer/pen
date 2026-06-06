// - Base ----------------------------------------------------------------------------------------------------------------


/** Base class for every file-router finding (parse + validation). */
export class FileRouterError extends Error {}


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


// - Segment Parse Errors ------------------------------------------------------------------------------------------------


export class MalformedSegmentError extends FileRouterError {
  constructor(public path: string, public reason: string) {
    super(
      `Malformed route segment at "${path}": ${reason}.\n\n` +
      'Rename the directory to a valid route segment.',
    )
    this.name = 'MalformedSegmentError'
  }
}


// - Sibling Conflict Errors (same parent — intrinsic) -------------------------------------------------------------------


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
      `[[...slug]] conflicts with a static sibling in "${path}".\n\n` +
      'Both match the base route — remove one or rename the segment.',
    )
    this.name = 'SplatIndexConflictError'
  }
}


// - Ancestry & Terminal Errors (intrinsic) ----------------------------------------------------------------------------


export class CatchallNotTerminalError extends FileRouterError {
  constructor(public path: string) {
    super(
      `Catch-all route "${path}" must be the last segment in the URL.\n\n` +
      'Routes nested below a [...slug] or [[...slug]] are unreachable.',
    )
    this.name = 'CatchallNotTerminalError'
  }
}

export class RepeatedSlugError extends FileRouterError {
  constructor(public path: string, public slug: string) {
    super(
      `Repeated slug name "${slug}" in "${path}".\n\n` +
      'A dynamic slug name can only appear once along a single route path.',
    )
    this.name = 'RepeatedSlugError'
  }
}

export class OptionalCatchallPageConflictError extends FileRouterError {
  constructor(public path: string) {
    super(
      `Optional catch-all "${path}" has the same specificity as its parent's page.\n\n` +
      'A [[...slug]] already matches the parent route, which also defines a page file.',
    )
    this.name = 'OptionalCatchallPageConflictError'
  }
}


// - Cross-branch Errors (relational) ----------------------------------------------------------------------------------


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


// - Aggregate -----------------------------------------------------------------------------------------------------------


export class RouteValidationErrors extends Error {
  constructor(public errors: FileRouterError[]) {
    super(
      `Found ${errors.length} route validation error${errors.length > 1 ? 's' : ''}:\n\n` +
      errors.map((e, i) => `${i + 1}. ${e.message}`).join('\n\n'),
    )
    this.name = 'RouteValidationErrors'
  }
}
