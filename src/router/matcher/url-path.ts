/** Normalizes a URL string into segments for matching: splits on '/' and
 *  drops every empty piece, so a leading slash, a trailing slash, and
 *  repeated slashes all collapse away on their own. The root URL becomes
 *  `[]` - no leading blank segment, matching `PositionNode.urlDepth`, which
 *  indexes straight into this array with no offset. */
export function normalizeUrl(urlString: string): string[] {
  return urlString.split('/').filter(Boolean)
}
