import { useRouter } from './use-router'

/**
 * Get navigation functions without url/data
 */
export function useNavigate() {
  const { push, replace, back, forward } = useRouter()
  return { push, replace, back, forward }
}
