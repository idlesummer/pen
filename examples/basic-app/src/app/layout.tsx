// examples/router-2/src/app/layout.tsx
import { Box, Text } from 'ink'
import { useInput } from 'ink'
import { useRouter } from '@idlesummer/pen'
import type { PropsWithChildren } from 'react'

export default function RootLayout({ children }: PropsWithChildren) {
  const router = useRouter()

  useInput((input) => {
    if (input === '1') router.push('/')
    if (input === '2') router.push('/about/')
    if (input === '3') router.push('/settings/')
    if (input === '4') router.push('/settings/profile/')
  })

  return (
    <Box borderStyle="round" flexDirection="column">
      {/* Header */}
      <Box paddingX={1} borderStyle="single" borderBottom borderTop={false} borderLeft={false} borderRight={false}>
        <Text dimColor>{router.url}</Text>
      </Box>

      {/* Navigation */}
      <Box paddingX={1} paddingBottom={0}>
        <Text dimColor>
          [1] Home  [2] About  [3] Settings  [4] Profile
        </Text>
      </Box>

      {/* Content */}
      <Box flexDirection="column" padding={1}>
        <Box flexDirection="row" justifyContent="center" paddingBottom={1}>
          <Text bold underline color="cyan">{'<My Terminal Application>'}</Text>
        </Box>
        {children}
      </Box>
    </Box>
  )
}
