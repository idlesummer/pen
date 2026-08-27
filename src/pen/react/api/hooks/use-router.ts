import { navigationStore } from '../store'

// eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
export function useRouter() {
  return navigationStore.actions
}
