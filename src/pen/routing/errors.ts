// - File Tree Errors ----------------------------------------------------------------------------------------------------


export class DirectoryNotFoundError extends Error {
  constructor(public path: string) {
    super(`Directory not found: "${path}"`)
    this.name = 'DirectoryNotFoundError'
  }
}

export class NotADirectoryError extends Error {
  constructor(public path: string) {
    super(`Path is not a directory: "${path}"`)
    this.name = 'NotADirectoryError'
  }
}


// - Segment Tree Errors -------------------------------------------------------------------------------------------------


export class DuplicateCatchallError extends Error {
  constructor(public path: string) {
    super(
      `Multiple [...slug] routes found in "${path}".\n\n` +
      'Only one [...slug] is allowed per directory.',
    )
    this.name = 'DuplicateCatchallError'
  }
}

export class DuplicateOptionalCatchallError extends Error {
  constructor(public path: string) {
    super(
      `Multiple [[...slug]] routes found in "${path}".\n\n` +
      'Only one [[...slug]] is allowed per directory.',
    )
    this.name = 'DuplicateOptionalCatchallError'
  }
}

export class ConflictingCatchallError extends Error {
  constructor(public path: string) {
    super(
      `Conflicting [...slug] and [[...slug]] routes in "${path}".\n\n` +
      'A [...slug] and [[...slug]] cannot coexist in the same directory.',
    )
    this.name = 'ConflictingCatchallError'
  }
}

export class ConflictingDynamicSegmentsError extends Error {
  constructor(public path: string, public params: string[]) {
    super(
      `Conflicting dynamic segments in "${path}": ${params.map(p => `[${p}]`).join(', ')}.\n\n` +
      'Only one [param] name is allowed per directory level.',
    )
    this.name = 'ConflictingDynamicSegmentsError'
  }
}

export class SplatIndexConflictError extends Error {
  constructor(public path: string) {
    super(
      `[[...slug]] conflicts with static "index" segment in "${path}".\n\n` +
      'Both match the base route — remove one or rename the index segment.',
    )
    this.name = 'SplatIndexConflictError'
  }
}

// - Route Tree Errors ---------------------------------------------------------------------------------------------------


export class RouteValidationErrors extends Error {
  constructor(public errors: Error[]) {
    super(
      `Found ${errors.length} route validation error${errors.length > 1 ? 's' : ''}:\n\n` +
      errors.map((e, i) => `${i + 1}. ${e.message}`).join('\n\n'),
    )
    this.name = 'RouteValidationErrors'
  }
}

export class DuplicateScreenError extends Error {
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
