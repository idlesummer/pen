import { use, useEffect } from 'react'
import { Box, Text } from 'ink'

let promise: Promise<string> | undefined

const fetchData = (): Promise<string> =>
  promise ??= new Promise(resolve => setTimeout(() => resolve('fetched after 1.5s'), 1500))

/** Simulates a slow data fetch - use() suspends until it resolves, and the
 *  sibling loading.tsx shows in the meantime. The cache is module-level, not
 *  a hook, since useMemo isn't guaranteed (and in practice doesn't) survive
 *  the suspend/retry cycle here - a plain closure does. The effect cleanup
 *  clears it on unmount, so leaving and coming back to this page refetches. */
export default function SlowPage() {
  useEffect(() => () => { promise = undefined }, [])
  const data = use(fetchData())

  return (
    <Box flexDirection="column">
      <Box>
        <Text>Hello World from </Text>
        <Text color="green" bold>SlowPage</Text>
      </Box>
      <Text color="yellow">data: {data}</Text>
    </Box>
  )
}
