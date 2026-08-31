/** Thrown by notFound() and caught only by NotFoundBoundary - ErrorBoundary
 *  re-throws it unrecognized so it keeps climbing past any error.tsx that
 *  doesn't also own a default.tsx, until it reaches one that does. */
export class NotFoundSignal extends Error {}

/** Call from anywhere in a page's render to show that position's default
 *  module instead of the page. Whether the underlying data exists is only
 *  knowable once this code actually runs, unlike route matching itself -
 *  so unlike a plain unmatched URL, this genuinely needs a runtime catch. */
export function notFound(): never {
  throw new NotFoundSignal()
}
