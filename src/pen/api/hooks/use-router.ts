import { navigationStore } from '../store'

// eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
export function useRouter() {
  const { push, replace, back, forward } = navigationStore
  return { push, replace, back, forward }
}
