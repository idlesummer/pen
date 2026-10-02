import { Box, Text } from 'ink'
import type { Params } from '@idlesummer/pen'

export default function HomeItemPage({ params }: { params: Params }) {
  return (
    <Box flexDirection="column">
      <Box>
        <Text>Hello World from </Text>
        <Text color="green" bold>HomeItemPage</Text>
      </Box>
      <Text color="yellow">param.id: {params.id}</Text>
    </Box>
  )
}
