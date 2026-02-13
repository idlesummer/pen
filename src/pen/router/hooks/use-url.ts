import { useRouter } from './use-router'

/**
 * Get the current URL
 */
export function useUrl(): string {
  const { url } = useRouter()
  return url
}
