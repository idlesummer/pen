import { useNavigate } from './use-navigate'

export function useRouter() {
  const { push, replace, back, forward } = useNavigate()
  return { push, replace, back, forward }
}
