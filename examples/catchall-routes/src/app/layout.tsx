import { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput } from 'ink'
import { usePathname, useRouter } from '@idlesummer/pen'
import type { PropsWithChildren } from 'react'

export default function RootLayout({ children }: PropsWithChildren) {
  const url = usePathname()
  const router = useRouter()
  const [draft, setDraft] = useState(url)

  useEffect(() => { setDraft(url) }, [url])

  useInput((char, key) => {
    if (key.return) {
      let next = draft.trim()
      if (!next.startsWith('/')) next = `/${next}`
      if (!next.endsWith('/')) next = `${next}/`
      router.push(next)
      setDraft(next)
    } else if (key.backspace || key.delete) {
      setDraft(prev => prev.slice(0, -1))
    } else if (key.escape) {
      setDraft(url)
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
        <Text inverse> </Text>
      </Box>

      <Box><Text dimColor>{'─'.repeat(40)}</Text></Box>

      {/* ── Page content ────────────────────────────────────── */}
      <Box flexDirection="column" paddingY={1}>
        {children}
      </Box>

      {/* ── Help ────────────────────────────────────────────── */}
      <Box><Text dimColor>{'─'.repeat(40)}</Text></Box>
      <Box paddingY={1}>
        <Text dimColor>type a path · Enter to go · Esc to cancel</Text>
      </Box>

    </Box>
  )
}
