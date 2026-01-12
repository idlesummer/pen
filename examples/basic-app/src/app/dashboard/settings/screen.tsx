import React from 'react'
import { Box, Text } from 'ink'

export default function SettingsScreen() {
  return (
    <Box flexDirection="column" gap={1}>
      <Text color="yellow" bold>Settings</Text>
      <Box flexDirection="column">
        <Text>⚙️  Theme: Dark</Text>
        <Text>🔔 Notifications: Enabled</Text>
        <Text>🌐 Language: English</Text>
      </Box>
    </Box>
  )
}
