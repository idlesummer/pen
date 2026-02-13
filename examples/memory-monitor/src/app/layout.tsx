import { Box, Text } from 'ink'
import { type ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Box flexDirection="column" padding={1}>
      {children}
    </Box>
  )
}
