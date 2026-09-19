import type { ReactNode } from 'react'
import { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { useRouter, usePathname } from '@idlesummer/pen'
import { componentMap } from '../.pen/generated/component-map'

export default function RootLayout({ children }: { children: ReactNode }) {
  const [value, setValue] = useState('')
  const { push } = useRouter()
  const pathname = usePathname()

  // Each page module path is its own URL, minus the trailing page.tsx - this
  // naturally includes dynamic segments too (home/[id]/page.tsx -> /home/[id]),
  // so it doubles as a hint for what to substitute when typing a path. Reads
  // componentMap here, not at module top level - layout.tsx and the
  // generated component-map.ts import each other, so componentMap isn't
  // initialized yet at layout.tsx's own module-evaluation time.
  const routes = Object.keys(componentMap.page)
    .map(path => '/' + path.replace(/(^|\/)page\.tsx$/, ''))
    .sort()

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
      <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1}>
        <Text>Routes:</Text>
        {routes.map(route => <Text key={route}>  {route}</Text>)}
      </Box>
      <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1} marginTop={1}>
        <Text>Current path: {pathname}</Text>
        <Text>Type a path and press Enter: {value}</Text>
      </Box>
      <Box borderStyle="round" borderColor="green" paddingX={1} marginTop={1}>
        {children}
      </Box>
    </Box>
  )
}
