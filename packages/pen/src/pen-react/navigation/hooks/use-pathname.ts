import { useNavigate } from './use-navigate'

/** Returns the pathname of the current URL.
 *
 *  The returned value updates when navigation changes the pathname.
 *
 *  @returns The current URL pathname. */
export function usePathname() {
  const { history, position } = useNavigate()
  return history[position]!.url
}
