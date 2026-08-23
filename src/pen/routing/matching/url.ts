/** Normalizes a raw URL string into its segment array before matching.
 *  Prepends a leading slash unless the string is empty (the root URL),
 *  then collapses any run of consecutive slashes into one.
 *  Guarantees no segment is ever an empty string except url[0] (always
 *  '', the root's own position) - safe for callers to use `!segment` in
 *  place of `segment === undefined`. */
export function normalizeUrl(urlString: string): string[] {
  const prefixed = urlString ? '/' + urlString : urlString
  const collapsed = prefixed.replace(/\/+/g, '/')
  return collapsed.split('/')
}
