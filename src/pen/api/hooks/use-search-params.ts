import { useNavigate } from './use-navigate'

export function useSearchParams() {
  const { searchParams } = useNavigate()
  return searchParams
}
