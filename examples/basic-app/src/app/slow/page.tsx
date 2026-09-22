import { use, useEffect } from 'react'
import { Box, Text } from 'ink'

let promise: Promise<string> | undefined

const fetchData = (): Promise<string> =>
  promise ??= new Promise(resolve => setTimeout(() => resolve('fetched after 1.5s'), 1500))

/** Simulates a slow data fetch - use() suspends until it resolves, and the
 *  sibling loading.tsx shows in the meantime. The cache has to live outside
 *  component state: React doesn't preserve hook state (useRef, useMemo,
 *  useState - none of them) across a suspended render that never committed,
 *  so any hook-based cache gets wiped on every retry and never converges.
 *  This is standard React Suspense behavior, not Ink-specific - the same
 *  reason SWR/React Query/Relay all keep their cache outside component
 *  state too. The effect cleanup clears it on unmount, so leaving and
 *  coming back to this page refetches. */
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
