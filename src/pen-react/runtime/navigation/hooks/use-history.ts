import { useNavigate } from './use-navigate'

/** Returns the visited-URL stack and the current position within it.
 *
 *  @returns The visited-URL stack and current position. */
export function useHistory() {
  const { history: stack, position } = useNavigate()
  return { stack, position }
}
