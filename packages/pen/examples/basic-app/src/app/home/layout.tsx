import type { PropsWithChildren, ReactNode } from 'react'
import { Box } from 'ink'

export default function HomeLayout({ children, sidebar }: PropsWithChildren<{ sidebar: ReactNode }>) {
  return (
    <Box flexDirection="row" height="100%">
      <Box width="50%" borderStyle="round">
        {children}
      </Box>
      <Box width="50%" borderStyle="round" borderColor="magenta">
        {sidebar}
      </Box>
    </Box>
  )
}
