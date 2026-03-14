import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput } from 'ink'
import { usePathname, useRouter } from '@idlesummer/pen'
import type { PropsWithChildren } from 'react'

export default function RootLayout({ children }: PropsWithChildren) {
  const url = usePathname()
  const router = useRouter()
  const [draft, setDraft] = useState(url)

  // ── Timing ────────────────────────────────────────────────────
  const pushAt = useRef<number | null>(null)
  const [lastMs, setLastMs] = useState<number | null>(null)

  // Fires after React has re-rendered with the new URL
  useEffect(() => {
    if (pushAt.current !== null) {
      setLastMs(performance.now() - pushAt.current)
      pushAt.current = null
    }
  }, [url])
  // ─────────────────────────────────────────────────────────────

  useInput((char, key) => {
    if (key.return) {
      // Normalise: ensure leading and trailing slash
      let url = draft.trim()
      if (!url.startsWith('/')) url = `/${url}`
      if (!url.endsWith('/')) url = `${url}/`
      pushAt.current = performance.now()   // start the clock
      router.push(url)
      setDraft(url)
    } else if (key.backspace || key.delete) {
      setDraft(prev => prev.slice(0, -1))
    } else if (key.escape) {
      setDraft(url)   // cancel edit, restore current URL
    } else if (char && !key.ctrl && !key.meta) {
      setDraft(prev => prev + char)
    }
  })

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>

      {/* ── URL bar ─────────────────────────────────────────── */}
      <Box paddingY={1}>
        <Text bold color="cyan">› </Text>
        <Text>{draft}</Text>
        <Text inverse> </Text>{/* blinking-cursor illusion */}
      </Box>

      <Box>
        <Text dimColor>{'─'.repeat(40)}</Text>
      </Box>

      {/* ── Page content ────────────────────────────────────── */}
      <Box flexDirection="column" paddingY={1}>
        {children}
      </Box>

      {/* ── Timing + Help ───────────────────────────────────── */}
      <Box>
        <Text dimColor>{'─'.repeat(40)}</Text>
      </Box>
      <Box paddingY={1} gap={2}>
        <Text dimColor>type a path · Enter to go · Esc to cancel</Text>
        {lastMs !== null && (
          <Text dimColor>last switch: <Text color="yellow">{lastMs.toFixed(2)}ms</Text></Text>
        )}
      </Box>

    </Box>
  )
}
