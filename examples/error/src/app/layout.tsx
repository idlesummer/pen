import { Box, Text } from 'ink'
import type { PropsWithChildren } from 'react'

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">App Layout</Text>
      <Box marginTop={1}>{children}</Box>
    </Box>
  )
}
