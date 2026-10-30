import { useNavigate } from './use-navigate'

/** Returns the current route.
 *
 *  The returned value updates when navigation changes the route.
 *
 *  @returns The current route. */
export function useRoute() {
  const { history, position } = useNavigate()
  return history[position]!
}
