/** Each role's raw glob'd entries, keyed by path - generic over the entry
 *  value's type, since it's `unknown` before cleaning and a confirmed
 *  component after. */
export type ModuleRegistry = {
  page: Record<string, unknown>
  layout: Record<string, unknown>
  loading: Record<string, unknown>
  error: Record<string, unknown>
  default: Record<string, unknown>
}
