import { use, useMemo } from 'react'
import { Box, Text } from 'ink'

// TEMP diagnostic counters - remove once the "loading forever" issue is resolved
let renderCount = 0
let fetchCount = 0

const fetchData = (): Promise<string> => {
  fetchCount++
  console.error(`[slow diagnostic] fetchData call #${fetchCount}`)
  return new Promise(resolve => setTimeout(() => {
    console.error(`[slow diagnostic] promise #${fetchCount} resolved`)
    resolve('fetched after 1.5s')
  }, 1500))
}

/** Simulates a slow data fetch - use() suspends until it resolves, and the
 *  sibling loading.tsx shows in the meantime. useMemo keeps the same promise
 *  across re-renders of this mount (use() needs a stable promise, not a new
 *  one every render), but a fresh mount - navigating back to this page -
 *  gets a fresh promise, so it refetches every visit. */
export default function SlowPage() {
  console.error(`[slow diagnostic] SlowPage render #${++renderCount}`)
  const promise = useMemo(fetchData, [])
  const data = use(promise)

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
