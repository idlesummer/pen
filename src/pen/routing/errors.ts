// - Base ----------------------------------------------------------------------------------------------------------------


/** Base class for every file-router finding (parse + validation). */
export class FileRouterError extends Error {}


// - Filesystem Preconditions --------------------------------------------------------------------------------------------


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


// - Route-tree Findings (pointer-local) ---------------------------------------------------------------------------------


export class MalformedSegmentError extends FileRouterError {
  constructor(public path: string, public reason: string) {
    super(
      `Malformed route segment at "${path}": ${reason}.\n\n` +
      'Rename the directory to a valid route segment.',
    )
    this.name = 'MalformedSegmentError'
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


// - URL-tree Findings (surface once groups are flattened) --------------------------------------------------------------
//
// These are detected on the projected URL tree, so each refers to a URL position
// rather than a directory — same-directory and cross-group conflicts are one and
// the same check.


export class DuplicateScreenError extends FileRouterError {
  constructor(
    public url: string,
    public files: [string, string],
  ) {
    super(
      `Conflicting screen routes at "${url}":\n` +
      files.map(f => `  - ${f}`).join('\n') + '\n\n' +
      'Each URL can only have one screen file.\n' +
      'Move one screen to a different URL or rename the route segment.',
    )
    this.name = 'DuplicateScreenError'
  }
}

export class ConflictingDynamicSegmentsError extends FileRouterError {
  constructor(public url: string, public params: string[]) {
    super(
      `Conflicting dynamic slug names at "${url}": ${params.map(p => `[${p}]`).join(', ')}.\n\n` +
      'A dynamic URL position must use one slug name across all branches.',
    )
    this.name = 'ConflictingDynamicSegmentsError'
  }
}

export class DuplicateCatchallError extends FileRouterError {
  constructor(public url: string) {
    super(
      `Multiple [...slug] routes resolve to "${url}".\n\n` +
      'Only one [...slug] is allowed per URL position.',
    )
    this.name = 'DuplicateCatchallError'
  }
}

export class DuplicateOptionalCatchallError extends FileRouterError {
  constructor(public url: string) {
    super(
      `Multiple [[...slug]] routes resolve to "${url}".\n\n` +
      'Only one [[...slug]] is allowed per URL position.',
    )
    this.name = 'DuplicateOptionalCatchallError'
  }
}

export class ConflictingCatchallError extends FileRouterError {
  constructor(public url: string) {
    super(
      `A [...slug] and a [[...slug]] both resolve to "${url}".\n\n` +
      'They cannot coexist at the same URL position.',
    )
    this.name = 'ConflictingCatchallError'
  }
}

export class SplatIndexConflictError extends FileRouterError {
  constructor(public url: string) {
    super(
      `[[...slug]] conflicts with a static route at "${url}".\n\n` +
      'Both match the base path — remove one or rename the segment.',
    )
    this.name = 'SplatIndexConflictError'
  }
}

export class OptionalCatchallPageConflictError extends FileRouterError {
  constructor(public url: string) {
    super(
      `Optional catch-all "${url}" has the same specificity as its parent's screen.\n\n` +
      'A [[...slug]] already matches the parent URL, which also defines a screen.',
    )
    this.name = 'OptionalCatchallPageConflictError'
  }
}

export class CatchallNotTerminalError extends FileRouterError {
  constructor(public url: string) {
    super(
      `Catch-all route "${url}" must be the last segment in the URL.\n\n` +
      'Routes nested below a [...slug] or [[...slug]] are unreachable.',
    )
    this.name = 'CatchallNotTerminalError'
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
