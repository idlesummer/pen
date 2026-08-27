import { useNavigate } from './use-navigate'

export function useSearchParams() {
  const { history, position } = useNavigate()
  return history[position]!.searchParams
}
