import { navigationStore } from '../store'

// eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
export function useRouter() {
  return {
    push:     navigationStore.push.bind(navigationStore),
    replace:  navigationStore.replace.bind(navigationStore),
    back:     navigationStore.back.bind(navigationStore),
    forward:  navigationStore.forward.bind(navigationStore),
  }
}
