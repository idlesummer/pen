/**
 * Step 3 (utility): Strips route-group segments (parenthesized) and the trailing
 * role name from a route key, producing a clean normalized URL.
 *
 * Equivalent to Next.js's normalizeAppPath.
 *
 * '/(marketing)/blog/screen' → '/blog'
 * '/about/screen'            → '/about'
 * '/screen'                  → '/'
 * '/user/[id]/screen'        → '/user/[id]'
 */
export function normalizeAppPath(routeKey: string): string {
  const parts = routeKey.split('/').filter(Boolean)
  const withoutRole = parts.slice(0, -1)
  const withoutGroups = withoutRole.filter(s => !(s.startsWith('(') && s.endsWith(')')))
  return withoutGroups.length ? `/${withoutGroups.join('/')}` : '/'
}
