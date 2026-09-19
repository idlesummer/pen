import { Box, Text } from 'ink'
import type { ParamTable } from '@idlesummer/pen'

export default function HomeItemPage({ params }: { params: ParamTable }) {
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
