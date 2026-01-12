// examples/router-2/src/app/settings/layout.tsx
import { Box, Text } from 'ink'
import type { PropsWithChildren } from 'react'

export default function SettingsLayout({ children }: PropsWithChildren) {
  return (
    <Box flexDirection="column">
      <Box borderStyle="single" borderColor="yellow" paddingX={1} marginBottom={1}>
        <Text bold color="yellow">⚙️  Settings</Text>
      </Box>
      <Box paddingLeft={2}>
        {children}
      </Box>
    </Box>
  )
}
