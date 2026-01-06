import { Box, Text } from 'ink'

export default function SettingsError() {
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="yellow">⚠️  Settings Error Boundary</Text>
      <Text>Something went wrong in settings</Text>
    </Box>
  )
}
