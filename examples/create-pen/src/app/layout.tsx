import { Box, Text } from 'ink'
import type { ReactNode } from 'react'

export default function Layout({ children }: { children?: ReactNode }) {
  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1} borderStyle="round" borderColor="cyan" paddingX={2}>
        <Text bold color="cyan">Welcome to Pen</Text>
      </Box>
      {children}
    </Box>
  )
}
