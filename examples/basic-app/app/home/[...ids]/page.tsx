import { Box, Text } from 'ink'
import type { ParamTable } from '@idlesummer/pen'

export default function HomeItemsPage({ params }: { params: ParamTable }) {
  return (
    <Box flexDirection="column">
      <Box>
        <Text>Hello World from </Text>
        <Text color="green" bold>HomeItemsPage</Text>
      </Box>
      <Text color="yellow">param.ids: {params.ids}</Text>
    </Box>
  )
}
