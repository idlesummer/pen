/** Raw glob entries grouped by route module role, keyed by file path. */
export type ModuleRegistry = {
  page: Record<string, unknown>
  layout: Record<string, unknown>
  loading: Record<string, unknown>
  error: Record<string, unknown>
  default: Record<string, unknown>
}

/** Loads each role in parallel and assembles the result into a ModuleRegistry.
 *  Agnostic to how a single role actually gets loaded - a glob pattern loaded
 *  through Vite's SSR pipeline, a path list loaded through dynamic import, etc.
 *
 *  @param roles - Each role's own input to loadRole.
 *  @param loadRole - Loads one role's modules.
 */
export async function createModuleRegistry<T>(roles: { page: T; layout: T; loading: T; error: T; default: T }, loadRole: (role: T) => Promise<Record<string, unknown>>): Promise<ModuleRegistry> {
  const [page, layout, loading, error, default_] = await Promise.all([
    loadRole(roles.page),
    loadRole(roles.layout),
    loadRole(roles.loading),
    loadRole(roles.error),
    loadRole(roles.default),
  ])
  return { page, layout, loading, error, default: default_ }
}
