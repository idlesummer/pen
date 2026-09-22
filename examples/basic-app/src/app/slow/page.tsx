import { Box, Text } from 'ink'

const fetchData = (): Promise<string> =>
  new Promise(resolve => setTimeout(() => resolve('fetched after 1.5s'), 1500))

/** An async page - pen calls it outside React and suspends on the result,
 *  so the sibling loading.tsx shows until it resolves. No cache, no hooks,
 *  no use(): the render tree is memoized per navigation, so revisiting the
 *  route re-runs this and refetches. */
export default async function SlowPage() {
  const data = await fetchData()

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
