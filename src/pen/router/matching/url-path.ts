/** Normalizes a URL string into segments for matching:
 *  -Adds a leading slash if non-empty.
 *  - Collapses consecutive slashes.
 *  - Keeps the root URL as a single empty segment. */
export function normalizeUrl(urlString: string): string[] {
  // could also remove whitespace only string and return early
  const prefixed = urlString ? `/${urlString}` : urlString
  const collapsed = prefixed.replace(/\/+/g, '/')
  return collapsed.split('/')
}
