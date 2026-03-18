// examples/kitchen-sink/src/app/layout.tsx
import type { PropsWithChildren } from 'react'
import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput } from 'ink'
import { usePathname, useRouter, useHistory } from '@idlesummer/pen'

export default function RootLayout({ children }: PropsWithChildren) {
  const url = usePathname()
  const router = useRouter()
  const { stack, position } = useHistory()

  const pushAt = useRef<number | null>(null)
  const [lastMs, setLastMs] = useState<number | null>(null)

  useEffect(() => {
    if (pushAt.current !== null) {
      setLastMs(performance.now() - pushAt.current)
      pushAt.current = null
    }
  }, [url])

  useInput((input) => {
    // On the type screen, let the screen handle all input
    if (url === '/type/') return

    pushAt.current = performance.now()
    switch (input) {
      case '1': router.push('/'); break
      case '2': router.push('/about'); break
      case '3': router.push('/history'); break
      case '4': router.push('/memory'); break
      case '5': router.push('/search-params', { greeting: 'hello from root', count: 42 }); break
      case '6': router.push('/users'); break
      case '7': router.push('/users/42', { role: 'admin' }); break
      case '8': router.push('/type'); break
      case 'b': router.back(); break
      case 'f': router.forward(); break
      case 'r': router.replace('/'); break
      default: pushAt.current = null
    }
  })

  return (
    <Box borderStyle="round" flexDirection="column">
      {/* Header: url + switch time */}
      <Box paddingX={1} borderStyle="single" borderBottom borderTop={false} borderLeft={false} borderRight={false} gap={2}>
        <Text dimColor>{url}</Text>
        {lastMs !== null && (
          <Text dimColor>switch: <Text color="yellow">{lastMs.toFixed(2)}ms</Text></Text>
        )}
        <Text dimColor>history: <Text color="cyan">{position + 1}/{stack.length}</Text></Text>
      </Box>

      {/* Navigation */}
      <Box paddingX={1} paddingTop={1}>
        <Text dimColor>[1] Home  [2] About  [3] History  [4] Memory  [5] Params  [6] Users  [7] /users/42  [8] Type  [b] Back  [f] Fwd  [r] Replace→/</Text>
      </Box>

      {/* Content */}
      <Box flexDirection="column" padding={1}>
        {children}
      </Box>
    </Box>
  )
}
