import { useNavigate } from './use-navigate'

/** Returns the visited-route stack and the current position within it.
 *
 *  @returns The visited-route stack and current position. */
export function useHistory() {
  const { history: stack, position } = useNavigate()
  return { stack, position }
}
