import { Box, Text } from 'ink'
import type { ErrorFallbackProps } from '@idlesummer/pen'

export default function BrokenError({ error }: ErrorFallbackProps) {
  return (
    <Box flexDirection="column">
      <Box>
        <Text>Hello World from </Text>
        <Text color="red" bold>BrokenError</Text>
      </Box>
      <Text color="yellow">caught: {error.message}</Text>
    </Box>
  )
}
