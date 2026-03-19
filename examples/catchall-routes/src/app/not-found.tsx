import { Box, Text } from 'ink'
import type { NotFoundComponentProps } from '@idlesummer/pen'

export default function NotFound({ url }: NotFoundComponentProps) {
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="red">404 — Not Found</Text>
      <Box>
        <Text dimColor>No route matches </Text>
        <Text>{url}</Text>
      </Box>
      <Text dimColor>Type another path above and press Enter.</Text>
    </Box>
  )
}
