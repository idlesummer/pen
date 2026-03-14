import { useNavigate } from './use-navigate'

export function usePathname() {
  return useNavigate().url
}
