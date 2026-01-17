import { useRouter } from './use-router'

/**
 * Access route data passed via router.push()
 *
 * @example
 * ```tsx
 * const user = useRouteData<User>()
 * if (!user) return <Text>No user</Text>
 * return <Text>{user.name}</Text>
 * ```
 */
export function useRouteData<T = unknown>() {
  const { data } = useRouter()
  return data as T | undefined
}
