import { Box, Text } from 'ink'

let promise: Promise<void> | undefined
let data: string | undefined

/** Simulates a slow data fetch by throwing a promise on first render -
 *  the sibling loading.tsx shows until it resolves. */
export default function SlowPage() {
  if (data === undefined) {
    promise ??= new Promise(resolve => setTimeout(() => {
      data = 'fetched after 1.5s'
      resolve()
    }, 1500))
    throw promise
  }

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
