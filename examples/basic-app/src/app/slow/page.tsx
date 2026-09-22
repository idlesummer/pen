import { use, useRef } from 'react'
import { Box, Text } from 'ink'

// TEMP diagnostic counter - remove once useRef is confirmed to survive
// the suspend/retry cycle
let fetchCount = 0

const fetchData = (): Promise<string> => {
  const count = ++fetchCount
  console.error(`[slow diagnostic] fetchData call #${count}`)
  return new Promise(resolve => setTimeout(() => {
    console.error(`[slow diagnostic] promise #${count} resolved`)
    resolve('fetched after 1.5s')
  }, 1500))
}

/** Simulates a slow data fetch - use() suspends until it resolves, and the
 *  sibling loading.tsx shows in the meantime. useRef holds the promise so
 *  it's stable across re-renders of this mount; a fresh mount (navigating
 *  back to this page) gets its own ref, so it refetches every visit. */
export default function SlowPage() {
  const promiseRef = useRef<Promise<string>>(undefined)
  const data = use(promiseRef.current ??= fetchData())

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
