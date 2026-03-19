import { Box, Text } from 'ink'

export default function HomeScreen() {
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="green">Home</Text>
      <Box flexDirection="column">
        <Text dimColor>Try navigating to:</Text>
        <Text>  /docs/guide/             <Text dimColor>← catchall [...slug]</Text></Text>
        <Text>  /docs/api/hooks/params/  <Text dimColor>← catchall, nested</Text></Text>
        <Text>  /wiki/                   <Text dimColor>← optional catchall [[...path]], no segments</Text></Text>
        <Text>  /wiki/getting-started/   <Text dimColor>← optional catchall, one segment</Text></Text>
      </Box>
    </Box>
  )
}
