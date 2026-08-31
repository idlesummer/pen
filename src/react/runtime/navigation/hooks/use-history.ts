import { useNavigate } from './use-navigate'

/** Returns controls for navigating through the browser's history.
 *  Use this hook to move backward or forward through previously visited URLs. */
export function useHistory() {
  const { history: stack, position } = useNavigate()
  return { stack, position }
}
