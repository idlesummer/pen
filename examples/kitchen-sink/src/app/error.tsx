// examples/kitchen-sink/src/app/error.tsx
import { Box, Text } from 'ink'
import type { ErrorComponentProps } from '@idlesummer/pen'

export default function RootError({ error, reset }: ErrorComponentProps) {
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="red">Something went wrong</Text>
      <Text dimColor>{error.message}</Text>
      <Text dimColor>Press <Text color="white">r</Text> to reset</Text>
    </Box>
  )
}
