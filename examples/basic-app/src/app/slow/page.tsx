import { use } from 'react'
import { Box, Text } from 'ink'

let promise: Promise<string> | undefined

/** Simulates a slow data fetch - use() suspends until it resolves, and the
 *  sibling loading.tsx shows in the meantime. */
function fetchData(): Promise<string> {
  return promise ??= new Promise(resolve => setTimeout(() => resolve('fetched after 1.5s'), 1500))
}

export default function SlowPage() {
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
