// examples/router-2/src/app/settings/screen.tsx
import { Box, Text } from 'ink'

export default function SettingsScreen() {
  return (
    <Box flexDirection="column">
      <Text bold>Settings Home</Text>
      <Box marginTop={1}>
        <Text>Configure your application preferences.</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Press [4] to view your profile</Text>
      </Box>
    </Box>
  )
}
