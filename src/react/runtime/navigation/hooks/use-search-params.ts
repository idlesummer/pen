import { useNavigate } from './use-navigate'

/** Returns the search parameters of the current URL.
 *  The returned value updates when navigation changes the URL's search parameters. */
export function useSearchParams() {
  const { history, position } = useNavigate()
  return history[position]!.searchParams
}
