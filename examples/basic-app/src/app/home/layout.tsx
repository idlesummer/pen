import type { PropsWithChildren, ReactNode } from 'react'
import { Box } from 'ink'

export default function HomeLayout({ children, sidebar }: PropsWithChildren<{ sidebar: ReactNode }>) {
  return (
    <Box>
      <Box flexDirection="column" flexGrow={1}>
        {children}
      </Box>
      <Box flexDirection="column" borderStyle="round" borderColor="magenta" paddingX={1} marginLeft={1}>
        {sidebar}
      </Box>
    </Box>
  )
}
