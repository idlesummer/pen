import { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { useRouter } from '@idlesummer/pen'
import type { PropsWithChildren } from 'react'

export default function RootLayout({ children }: PropsWithChildren) {
  const router = useRouter()
  const [draft, setDraft] = useState(router.url)

  useInput((char, key) => {
    if (key.return) {
      // Normalise: ensure leading and trailing slash
      let url = draft.trim()
      if (!url.startsWith('/')) url = `/${url}`
      if (!url.endsWith('/')) url = `${url}/`
      router.push(url)
      setDraft(url)
    } else if (key.backspace || key.delete) {
      setDraft(prev => prev.slice(0, -1))
    } else if (key.escape) {
      setDraft(router.url)   // cancel edit, restore current URL
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

      {/* ── Help ────────────────────────────────────────────── */}
      <Box>
        <Text dimColor>{'─'.repeat(40)}</Text>
      </Box>
      <Box paddingY={1}>
        <Text dimColor>type a path · Enter to go · Esc to cancel</Text>
      </Box>

    </Box>
  )
}
