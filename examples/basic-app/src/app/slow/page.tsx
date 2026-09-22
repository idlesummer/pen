import { use, useMemo } from 'react'
import { Box, Text } from 'ink'

// TEMP diagnostic - remove once the split is confirmed to fix it
let fetchCount = 0

function fetchData(): Promise<string> {
  const count = ++fetchCount
  console.error(`[slow diagnostic] fetchData call #${count}`)
  return new Promise(resolve => setTimeout(() => {
    console.error(`[slow diagnostic] promise #${count} resolved`)
    resolve('fetched after 1.5s')
  }, 1500))
}

function SlowContent({ dataPromise }: { dataPromise: Promise<string> }) {
  const data = use(dataPromise)

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

/** Simulates a slow data fetch - use() suspends until it resolves, and the
 *  sibling loading.tsx shows in the meantime. The promise has to be created
 *  in a component that itself never suspends: SlowPage owns the useMemo and
 *  passes the promise down as a prop, while SlowContent is the one that
 *  actually calls use() and suspends. React only wipes hook state on the
 *  fiber that suspends, not its ancestors - so SlowPage's useMemo survives
 *  SlowContent's retries fine. */
export default function SlowPage() {
  const dataPromise = useMemo(fetchData, [])
  return <SlowContent dataPromise={dataPromise} />
}
