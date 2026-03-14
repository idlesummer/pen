import type { PropsWithChildren } from 'react'
import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput } from 'ink'
import { usePathname, useRouter } from '@idlesummer/pen'

export default function RootLayout({ children }: PropsWithChildren) {
  const url = usePathname()
  const router = useRouter()

  const pushAt = useRef<number | null>(null)
  const [lastMs, setLastMs] = useState<number | null>(null)

  useEffect(() => {
    if (pushAt.current !== null) {
      setLastMs(performance.now() - pushAt.current)
      pushAt.current = null
    }
  }, [url])

  useInput((input) => {
    pushAt.current = performance.now()
    if (input === '1') router.push('/')
    else if (input === '2') router.push('/about/')
    else if (input === '3') router.push('/settings/')
    else if (input === '4') router.push('/settings/profile/')
    else pushAt.current = null  // not a navigation key, discard
  })

  return (
    <Box borderStyle="round" flexDirection="column">
      {/* Header */}
      <Box paddingX={1} borderStyle="single" borderBottom borderTop={false} borderLeft={false} borderRight={false} gap={2}>
        <Text dimColor>{url}</Text>
        {lastMs !== null && (
          <Text dimColor>switch: <Text color="yellow">{lastMs.toFixed(2)}ms</Text></Text>
        )}
      </Box>

      {/* Navigation */}
      <Box paddingX={1} paddingBottom={0}>
        <Text dimColor>[1] Home  [2] About  [3] Settings  [4] Profile</Text>
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
