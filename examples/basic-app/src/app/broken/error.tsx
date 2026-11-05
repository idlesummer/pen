import type { ComponentProps } from 'react'
import { Box, Text } from 'ink'
import type { ErrorComponent } from '@idlesummer/pen'

export default function BrokenError({ error }: ComponentProps<ErrorComponent>) {
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
