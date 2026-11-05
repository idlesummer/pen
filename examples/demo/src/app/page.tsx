// src/app/page.tsx
import { useState, useEffect } from 'react'
import { Box, Text } from 'ink'

export default function RootPage() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setCount(c => c + 1), 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <Box alignSelf="flex-start" justifyContent='center' alignItems='center'>
        <Text color="cyan">Count: {count}</Text>
      </Box>
    </>
  )
}
