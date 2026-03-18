// examples/kitchen-sink/src/app/not-found.tsx
import { Box, Text } from 'ink'
import type { NotFoundComponentProps } from '@idlesummer/pen'

export default function RootNotFound({ url }: NotFoundComponentProps) {
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="yellow">404 — Not Found</Text>
      <Text dimColor>No route matched: <Text color="white">{url}</Text></Text>
    </Box>
  )
}
