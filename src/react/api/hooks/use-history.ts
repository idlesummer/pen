import { useNavigate } from './use-navigate'

export function useHistory() {
  const { history: stack, position } = useNavigate()
  return { stack, position }
}
