import { useNavigate } from './use-navigate'

export function usePathname() {
  const { url } = useNavigate()
  return url
}
