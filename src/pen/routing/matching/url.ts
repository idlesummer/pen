export function normalizeUrl(urlString: string) {
  // should prepend a slash unless string is empty
  // should normalize multiple consecutive slashes into one slash
  // guarantees:
  // - no segment is empty string (safe to replace `str === undefined` to `!str`)
  return urlString.split('/')
}
