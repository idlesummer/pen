import { Text } from 'ink'

/** Built-in fallback rendered when an app defines no root `default.tsx` -
 *  guarantees every URL resolves to something instead of a blank screen. */
export function DefaultFallback() {
  return <Text>404 - Not Found</Text>
}
