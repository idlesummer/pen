import { useNavigate } from './use-navigate'

/** Returns the visited-URL stack and the current position within it.
 *  For back/forward navigation itself, use `useRouter`. */
export function useHistory() {
  const { history: stack, position } = useNavigate()
  return { stack, position }
}
