import { useNavigate } from './use-navigate'

export function useSearchParams() {
  return useNavigate().searchParams
}
