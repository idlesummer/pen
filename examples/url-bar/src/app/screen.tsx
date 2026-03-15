import { Box, Text } from 'ink'

export default function HomeScreen() {
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="green">Home</Text>
      <Box flexDirection="column">
        <Text dimColor>Try navigating to:</Text>
        <Text>  /about/</Text>
        <Text>  /users/alice/</Text>
        <Text>  /users/42/</Text>
        <Text>  /doesnt-exist/</Text>
      </Box>
    </Box>
  )
}
