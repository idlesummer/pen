// examples/kitchen-sink/src/app/(demos)/go/screen.tsx
// Type a URL and press Enter to navigate to it — lives at /go/
import { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { useRouter, usePathname } from '@idlesummer/pen'

export default function GoScreen() {
  const router = useRouter()
  const url = usePathname()
  const [draft, setDraft] = useState('/')

  useInput((char, key) => {
    if (key.return) {
      let target = draft.trim()
      if (!target.startsWith('/')) target = `/${target}`
      if (!target.endsWith('/')) target = `${target}/`
      router.push(target)
    } else if (key.backspace || key.delete) {
      setDraft(prev => prev.slice(0, -1))
    } else if (key.escape) {
      setDraft('/')
    } else if (char && !key.ctrl && !key.meta) {
      setDraft(prev => prev + char)
    }
  })

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">Navigate to URL</Text>

      {/* Input */}
      <Box gap={1}>
        <Text bold color="cyan">›</Text>
        <Text>{draft}<Text inverse> </Text></Text>
      </Box>

      <Text dimColor>Enter to go · Esc to reset · Backspace to delete</Text>
    </Box>
  )
}
