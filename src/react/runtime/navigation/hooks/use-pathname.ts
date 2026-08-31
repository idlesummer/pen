import { useNavigate } from './use-navigate'

export function usePathname() {
  const { history, position } = useNavigate()
  return history[position]!.url
}
