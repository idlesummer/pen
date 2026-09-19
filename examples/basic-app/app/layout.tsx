import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { useRouter, usePathname } from '@idlesummer/pen'

const FILE_TREE = `Routes:
/
├─ default.tsx
├─ home
│  ├─ [id]
│  │  └─ page.tsx
│  ├─ about
│  │  └─ page.tsx
│  └─ page.tsx
├─ layout.tsx
└─ page.tsx`

export default function RootLayout({ children }: { children: ReactNode }) {
  const [value, setValue] = useState('')
  const { push } = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    console.log(FILE_TREE)
  }, [])

  useInput((input, key) => {
    if (key.return) {
      push(value)
      setValue('')
    }
    else if (key.backspace || key.delete)
      setValue(current => current.slice(0, -1))
    else if (!key.ctrl && !key.meta)
      setValue(current => current + input)
  })

  return (
    <Box flexDirection="column">
      <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
        <Text>Current path: {pathname}</Text>
        <Text>Browser url: {value}</Text>
      </Box>
      <Box borderStyle="round" borderColor="green" paddingX={1}>
        {children}
      </Box>
    </Box>
  )
}
