import { Box, Text } from 'ink'

export default function RootError() {
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="red">🚨 Root Error Boundary</Text>
      <Text>Something went wrong at the root level</Text>
    </Box>
  )
}
