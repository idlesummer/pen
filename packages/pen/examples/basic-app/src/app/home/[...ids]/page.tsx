import { Box, Text } from 'ink'
import type { Params } from '@idlesummer/pen'

export default function HomeItemsPage({ params }: { params: Params }) {
  return (
    <Box flexDirection="column">
      <Box>
        <Text>Hello World from </Text>
        <Text color="green" bold>HomeItemsPage</Text>
      </Box>
      <Text color="yellow">param.ids: {JSON.stringify(params.ids)}</Text>
    </Box>
  )
}
